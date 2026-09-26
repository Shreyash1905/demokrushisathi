import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SearchProvider } from '../context/SearchContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SearchProvider>
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-main">
          <Header />
          <main className="dashboard-content">
            <Outlet />
          </main>
        </div>
      </div>
    </SearchProvider>
  );
};

export default DashboardLayout;
