/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminProducts from './pages/admin/AdminProducts';
import AdminSettings from './pages/admin/AdminSettings';
import DistributorDashboard from './pages/distributor/Dashboard';
import DistributorProfile from './pages/distributor/Profile';
import ProformaBuilder from './pages/distributor/ProformaBuilder';
import ProformaView from './pages/distributor/ProformaView';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Login />} />
            <Route path="admin" element={<AdminProducts />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="distributor" element={<DistributorDashboard />} />
            <Route path="distributor/profile" element={<DistributorProfile />} />
            <Route path="distributor/proforma/new" element={<ProformaBuilder />} />
            <Route path="distributor/proforma/:id" element={<ProformaView />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
