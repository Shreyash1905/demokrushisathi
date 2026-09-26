import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Leaf, 
  FileCheck, 
  Briefcase, 
  TrendingUp, 
  Settings, 
  LogOut,
  HelpCircle,
  Sprout,
  Store,
  FileText
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { userRole, logout } = useAuth();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getNavItems = () => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { name: 'Overview', path: '/admin', icon: <LayoutDashboard size={20} /> },
          { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
          { name: 'Farmers', path: '/admin/farmers', icon: <Sprout size={20} /> },
          { name: 'FPOs', path: '/admin/fpos', icon: <Briefcase size={20} /> },
          { name: 'Expert Cases', path: '/admin/cases', icon: <FileCheck size={20} /> },
          { name: 'Buyers', path: '/admin/buyers', icon: <Store size={20} /> },
          { name: 'Market', path: '/admin/market', icon: <TrendingUp size={20} /> },
          { name: 'Transactions', path: '/admin/transactions', icon: <FileText size={20} /> },
        ];
      case 'EXPERT':
        return [
          { name: 'Overview', path: '/expert', icon: <LayoutDashboard size={20} /> },
          { name: 'Cases', path: '/expert/cases', icon: <FileCheck size={20} /> },
          { name: 'Knowledge', path: '/expert/knowledge', icon: <Leaf size={20} /> },
        ];
      case 'FPO':
        return [
          { name: 'Overview', path: '/fpo', icon: <LayoutDashboard size={20} /> },
          { name: 'Members', path: '/fpo/members', icon: <Users size={20} /> },
          { name: 'Harvest', path: '/fpo/harvest', icon: <Sprout size={20} /> },
          { name: 'Buyer Demands', path: '/fpo/demands', icon: <Store size={20} /> },
          { name: 'Matches', path: '/fpo/matches', icon: <Briefcase size={20} /> },
          { name: 'Offers', path: '/fpo/offers', icon: <FileText size={20} /> },
          { name: 'Transactions', path: '/fpo/transactions', icon: <TrendingUp size={20} /> },
        ];
      case 'BUYER':
        return [
          { name: 'Overview', path: '/buyer', icon: <LayoutDashboard size={20} /> },
          { name: 'Requirements', path: '/buyer/requirements', icon: <FileText size={20} /> },
          { name: 'Supply', path: '/buyer/supply', icon: <Store size={20} /> },
          { name: 'Offers', path: '/buyer/offers', icon: <Briefcase size={20} /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Leaf className="logo-icon" size={24} />
          <span className="logo-text">Krushi Sathi</span>
        </div>
        <div className="role-badge badge badge-success">{userRole}</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === `/${userRole.toLowerCase()}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={() => setIsHelpOpen(true)}>
          <HelpCircle size={20} />
          <span>Help</span>
        </button>
        <button className="nav-item" onClick={() => setIsSettingsOpen(true)}>
          <Settings size={20} />
          <span>Settings</span>
        </button>
        <button className="nav-item text-error" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Help & Documentation">
        <div className="flex flex-col gap-4 text-secondary">
          <p>Welcome to Krushi Sathi support. Based on your role (<strong>{userRole}</strong>), here is some quick guidance:</p>
          {userRole === 'ADMIN' && <p>As an Admin, use this dashboard to monitor platform health, verify users, and oversee transactions.</p>}
          {userRole === 'EXPERT' && <p>As an Expert, your role is to review AI observations and provide human validation for crop diseases.</p>}
          {userRole === 'FPO' && <p>As an FPO, manage your members, aggregate harvest, and match with buyer demands.</p>}
          {userRole === 'BUYER' && <p>As a Buyer, post your requirements and make offers directly to verified FPOs.</p>}
          <p>If you need further assistance, contact support@krushisathi.in.</p>
        </div>
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Application Settings">
        <div className="flex flex-col gap-4">
          <p className="text-secondary">Manage your preferences.</p>
          <div className="form-group">
            <label className="form-label">Email Notifications</label>
            <select className="form-input">
              <option>All notifications</option>
              <option>Important only</option>
              <option>None</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => setIsSettingsOpen(false)}>Save Preferences</button>
        </div>
      </Modal>
    </aside>
  );
};

export default Sidebar;
