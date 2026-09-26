import React, { useState } from 'react';
import { Bell, Search, Menu, User, LogOut } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import './Header.css';

const Header = () => {
  const { currentUser, userRole, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-left">
        <button className="btn-icon mobile-menu-btn">
          <Menu size={20} />
        </button>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="search-input" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="header-right">
        <button className="btn-icon notification-btn" onClick={() => setIsNotifOpen(true)}>
          <Bell size={20} />
          {/* <span className="notification-dot"></span> */}
        </button>
        
        <div className="user-profile" onClick={() => setIsProfileOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            <span className="user-email">{currentUser?.email}</span>
          </div>
        </div>
      </div>

      <Modal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} title="Notifications">
        <div className="flex flex-col gap-4 text-center p-8 text-secondary">
          <Bell size={32} className="mx-auto text-gray-300" style={{ margin: '0 auto', opacity: 0.5 }} />
          <p>No new notifications.</p>
        </div>
      </Modal>

      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="My Profile">
        <div className="flex flex-col gap-4">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} />
            </div>
            <div>
              <p className="font-bold">{currentUser?.email}</p>
              <p className="text-secondary text-sm">Role: {userRole}</p>
              <p className="text-secondary text-sm">UID: {currentUser?.uid}</p>
            </div>
          </div>
          <button className="btn btn-secondary mt-4 flex items-center justify-center gap-2" style={{ color: 'var(--color-error)', border: '1px solid var(--color-error)' }} onClick={logout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </Modal>
    </header>
  );
};

export default Header;
