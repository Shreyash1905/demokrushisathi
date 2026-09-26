import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

import AdminDashboard from './pages/admin/AdminDashboard';
import ExpertDashboard from './pages/expert/ExpertDashboard';
import FPODashboard from './pages/fpo/FPODashboard';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import GenericListPage from './pages/GenericListPage';
import FPOHarvestPage from './pages/fpo/FPOHarvestPage';
import FPOOffersPage from './pages/fpo/FPOOffersPage';
import FPOMembersPage from './pages/fpo/FPOMembersPage';
import FPOBuyerDemandsPage from './pages/fpo/FPOBuyerDemandsPage';
import FPOMatchesPage from './pages/fpo/FPOMatchesPage';
import BuyerRequirementsPage from './pages/buyer/BuyerRequirementsPage';
import BuyerSupplyPage from './pages/buyer/BuyerSupplyPage';
import ExpertCasesPage from './pages/expert/ExpertCasesPage';

const defaultCols = [
  { header: 'ID', accessor: 'id' },
  { header: 'Name', accessor: 'name' },
  { header: 'Status', accessor: 'status' },
  { header: 'Created', accessor: 'createdAt' }
];

const cropCols = [
  { header: 'ID', accessor: 'id' },
  { header: 'Crop', accessor: 'crop' },
  { header: 'Quantity', accessor: 'quantity' },
  { header: 'Status', accessor: 'status' }
];

const userCols = [
  { header: 'ID', accessor: 'id' },
  { header: 'Email', accessor: 'email' },
  { header: 'Role', accessor: 'role' },
  { header: 'Status', accessor: 'status' }
];

const txCols = [
  { header: 'ID', accessor: 'id' },
  { header: 'Crop', accessor: 'crop' },
  { header: 'Quantity', accessor: 'quantity' },
  { header: 'Price', accessor: 'agreedPrice' },
  { header: 'Status', accessor: 'status' }
];

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<GenericListPage title="Users" description="Manage platform users." collectionName="users" columns={userCols} />} />
            <Route path="farmers" element={<GenericListPage title="Farmers" description="Platform farmers." collectionName="farmers" columns={defaultCols} />} />
            <Route path="fpos" element={<GenericListPage title="FPOs" description="Manage FPOs." collectionName="fpos" columns={defaultCols} />} />
            <Route path="cases" element={<GenericListPage title="Expert Cases" description="Monitor crop health cases." collectionName="expertCases" columns={cropCols} />} />
            <Route path="buyers" element={<GenericListPage title="Buyers" description="Registered buyers." collectionName="buyers" columns={defaultCols} />} />
            <Route path="market" element={<GenericListPage title="Market" description="Active harvest listings." collectionName="harvestListings" columns={cropCols} />} />
            <Route path="transactions" element={<GenericListPage title="Transactions" description="Platform transactions." collectionName="transactions" columns={txCols} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* Expert Routes */}
          <Route 
            path="/expert/*" 
            element={
              <ProtectedRoute allowedRoles={['EXPERT']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ExpertDashboard />} />
            <Route path="cases" element={<ExpertCasesPage />} />
            <Route path="knowledge" element={<GenericListPage title="Knowledge Base" description="Reference materials." collectionName="knowledge" columns={defaultCols} />} />
            <Route path="*" element={<Navigate to="/expert" replace />} />
          </Route>

          {/* FPO Routes */}
          <Route 
            path="/fpo/*" 
            element={
              <ProtectedRoute allowedRoles={['FPO']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<FPODashboard />} />
            <Route path="members" element={<FPOMembersPage />} />
            <Route path="harvest" element={<FPOHarvestPage />} />
            <Route path="demands" element={<FPOBuyerDemandsPage />} />
            <Route path="matches" element={<FPOMatchesPage />} />
            <Route path="offers" element={<FPOOffersPage />} />
            <Route path="transactions" element={<GenericListPage title="Transactions" description="Your deals." collectionName="transactions" columns={txCols} filterBySellerId={true} />} />
            <Route path="*" element={<Navigate to="/fpo" replace />} />
          </Route>

          {/* Buyer Routes */}
          <Route 
            path="/buyer/*" 
            element={
              <ProtectedRoute allowedRoles={['BUYER']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<BuyerDashboard />} />
            <Route path="requirements" element={<BuyerRequirementsPage />} />
            <Route path="supply" element={<BuyerSupplyPage />} />
            <Route path="offers" element={<GenericListPage title="Offers" description="Your outbound offers." collectionName="offers" columns={cropCols} filterByBuyerId={true} />} />
            <Route path="*" element={<Navigate to="/buyer" replace />} />
          </Route>

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
