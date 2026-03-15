export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
}

export interface DistributorProfile {
  companyName: string;
  ownerName: string;
  ruc: string;
  phone: string;
  email: string;
  logoUrl: string;
  primaryColor?: string;
}

export interface ClientInfo {
  name: string;
  ruc: string;
  email: string;
  phone: string;
}

export interface ProformaItem {
  id: string;
  productId: string; // 'custom' if added manually
  name: string;
  description: string;
  quantity: number;
  duration: number; // e.g. 12
  durationUnit: 'Meses' | 'Años' | 'Unidades';
  unitPrice: number;
}

export interface Proforma {
  id: string;
  ownerId: string;
  date: string;
  distributor: DistributorProfile;
  client: ClientInfo;
  items: ProformaItem[];
  subtotal: number;
  iva: number; // 15%
  total: number;
  aiCopy: string;
  notes: string;
}

export interface DraftProforma {
  client: ClientInfo;
  items: ProformaItem[];
  notes: string;
  aiCopy: string;
}

export interface AdminSettings {
  aiContext: string;
  ivaPercentage: number;
  defaultLogoUrl?: string;
  primaryColor?: string;
}

export type Role = 'admin' | 'distributor' | null;

export interface User {
  uid: string;
  email: string;
  role: Role;
  profile?: DistributorProfile;
}
