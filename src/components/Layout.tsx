import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogOut, Settings, Package, FileText, User } from 'lucide-react';

export default function Layout() {
  const { role, logout, distributorProfile, adminSettings, isAuthReady } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!role && location.pathname !== '/') {
    // Basic protection
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  if (!role) {
    return <Outlet />; // For Login page
  }

  const primaryColor = role === 'distributor' 
    ? (distributorProfile.primaryColor || adminSettings.primaryColor || '#4f46e5')
    : (adminSettings.primaryColor || '#4f46e5');

  const logoUrl = role === 'distributor'
    ? (distributorProfile.logoUrl || adminSettings.defaultLogoUrl)
    : adminSettings.defaultLogoUrl;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white shadow-sm border-b border-slate-200 print:hidden" style={{ borderBottomColor: `${primaryColor}30` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {role === 'admin' ? (
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
                ) : null}
                <span className="text-xl font-bold" style={{ color: primaryColor }}>Admin Portal</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
                ) : null}
                <span className="text-lg font-bold" style={{ color: primaryColor }}>{distributorProfile.companyName || 'Distribuidor'}</span>
              </div>
            )}
          </div>
          <nav className="flex items-center gap-6">
            {role === 'admin' && (
              <>
                <Link to="/admin" className={`text-sm font-medium ${location.pathname === '/admin' ? '' : 'text-slate-600 hover:text-slate-900'}`} style={location.pathname === '/admin' ? { color: primaryColor } : {}}>
                  <Package className="h-4 w-4 inline mr-1" /> Productos
                </Link>
                <Link to="/admin/settings" className={`text-sm font-medium ${location.pathname === '/admin/settings' ? '' : 'text-slate-600 hover:text-slate-900'}`} style={location.pathname === '/admin/settings' ? { color: primaryColor } : {}}>
                  <Settings className="h-4 w-4 inline mr-1" /> Configuración IA
                </Link>
              </>
            )}
            {role === 'distributor' && (
              <>
                <Link to="/distributor" className={`text-sm font-medium ${location.pathname === '/distributor' ? '' : 'text-slate-600 hover:text-slate-900'}`} style={location.pathname === '/distributor' ? { color: primaryColor } : {}}>
                  <FileText className="h-4 w-4 inline mr-1" /> Proformas
                </Link>
                <Link to="/distributor/profile" className={`text-sm font-medium ${location.pathname === '/distributor/profile' ? '' : 'text-slate-600 hover:text-slate-900'}`} style={location.pathname === '/distributor/profile' ? { color: primaryColor } : {}}>
                  <User className="h-4 w-4 inline mr-1" /> Mi Perfil
                </Link>
              </>
            )}
            <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 ml-4 border-l pl-4">
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:max-w-none">
        <Outlet />
      </main>
    </div>
  );
}
