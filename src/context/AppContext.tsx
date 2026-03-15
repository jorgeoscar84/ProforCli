import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, DistributorProfile, Proforma, AdminSettings, Role, DraftProforma, User } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface AppContextType {
  user: User | null;
  role: Role;
  logout: () => void;
  products: Product[];
  addProduct: (product: Product) => void;
  addProducts: (newProducts: Product[]) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  distributorProfile: DistributorProfile;
  setDistributorProfile: (profile: DistributorProfile) => void;
  proformas: Proforma[];
  addProforma: (proforma: Proforma) => void;
  deleteProforma: (id: string) => void;
  adminSettings: AdminSettings;
  setAdminSettings: (settings: AdminSettings) => void;
  draftProforma: DraftProforma;
  setDraftProforma: React.Dispatch<React.SetStateAction<DraftProforma>>;
  clearDraftProforma: () => void;
  isAuthReady: boolean;
}

const defaultProfile: DistributorProfile = {
  companyName: '',
  ownerName: '',
  ruc: '',
  phone: '',
  email: '',
  logoUrl: '',
};

const defaultSettings: AdminSettings = {
  aiContext: 'Somos una empresa de software contable en Ecuador. Nuestros planes incluyen facturación electrónica, inventario y contabilidad. Queremos que las proformas suenen profesionales, persuasivas y enfocadas en el ahorro de tiempo y cumplimiento tributario con el SRI.',
  ivaPercentage: 15,
  defaultLogoUrl: 'https://picsum.photos/seed/admin/200/60',
  primaryColor: '#4f46e5',
};

const defaultDraftProforma: DraftProforma = {
  client: { name: '', ruc: '', email: '', phone: '' },
  items: [],
  notes: 'Esta proforma tiene una validez de 15 días.',
  aiCopy: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [distributorProfile, setDistributorProfileState] = useState<DistributorProfile>(defaultProfile);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [adminSettings, setAdminSettingsState] = useState<AdminSettings>(defaultSettings);
  
  // Draft proforma remains in local storage
  const loadDraft = (): DraftProforma => {
    try {
      const saved = localStorage.getItem('app_draft_proforma');
      return saved ? JSON.parse(saved) : defaultDraftProforma;
    } catch (e) {
      return defaultDraftProforma;
    }
  };
  const [draftProforma, setDraftProforma] = useState<DraftProforma>(loadDraft());

  useEffect(() => localStorage.setItem('app_draft_proforma', JSON.stringify(draftProforma)), [draftProforma]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'app_draft_proforma' && e.newValue) setDraftProforma(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user document to get role and profile
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({ ...userData, uid: firebaseUser.uid, email: firebaseUser.email || '' });
            setRole(userData.role);
            if (userData.profile) {
              setDistributorProfileState(userData.profile);
            }
          } else {
            // If user doc doesn't exist, they might be the default admin
            if (firebaseUser.email === 'jorgeoscar84@gmail.com') {
               setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'admin' });
               setRole('admin');
            } else {
               setUser(null);
               setRole(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      } else {
        setUser(null);
        setRole(null);
        setDistributorProfileState(defaultProfile);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!isAuthReady || !user) return;

    // Listen to Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => prods.push({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    // Listen to Admin Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'admin'), (docSnap) => {
      if (docSnap.exists()) {
        setAdminSettingsState(docSnap.data() as AdminSettings);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/admin'));

    // Listen to Proformas
    let q = collection(db, 'proformas');
    if (role === 'distributor') {
      q = query(collection(db, 'proformas'), where('ownerId', '==', user.uid)) as any;
    }
    const unsubProformas = onSnapshot(q, (snapshot) => {
      const profs: Proforma[] = [];
      snapshot.forEach((doc) => profs.push({ id: doc.id, ...doc.data() } as Proforma));
      // Sort by date descending
      profs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setProformas(profs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'proformas'));

    // Listen to User Profile changes (if distributor)
    let unsubProfile = () => {};
    if (role === 'distributor') {
      unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as User;
          if (userData.profile) {
            setDistributorProfileState(userData.profile);
          }
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));
    }

    return () => {
      unsubProducts();
      unsubSettings();
      unsubProformas();
      unsubProfile();
    };
  }, [isAuthReady, user, role]);

  const logout = async () => {
    await signOut(auth);
  };

  const addProduct = async (product: Product) => {
    try {
      await setDoc(doc(db, 'products', product.id), product);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${product.id}`);
    }
  };

  const addProducts = async (newProducts: Product[]) => {
    for (const p of newProducts) {
      await addProduct(p);
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), { ...product });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${product.id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const setDistributorProfile = async (profile: DistributorProfile) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { profile });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const addProforma = async (proforma: Proforma) => {
    if (!user) return;
    try {
      const proformaData = { ...proforma, ownerId: user.uid };
      await setDoc(doc(db, 'proformas', proforma.id), proformaData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `proformas/${proforma.id}`);
    }
  };

  const deleteProforma = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'proformas', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `proformas/${id}`);
    }
  };

  const setAdminSettings = async (settings: AdminSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'admin'), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/admin');
    }
  };

  const clearDraftProforma = () => setDraftProforma(defaultDraftProforma);

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        logout,
        products,
        addProduct,
        addProducts,
        updateProduct,
        deleteProduct,
        distributorProfile,
        setDistributorProfile,
        proformas,
        addProforma,
        deleteProforma,
        adminSettings,
        setAdminSettings,
        draftProforma,
        setDraftProforma,
        clearDraftProforma,
        isAuthReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
