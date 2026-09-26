import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();

  const handleBack = () => {
    if (userRole) {
      navigate(`/${userRole.toLowerCase()}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card" style={{ textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--color-error)" style={{ margin: '0 auto 16px' }} />
        <h2 className="text-xl font-bold" style={{ marginBottom: '8px' }}>Access Denied</h2>
        <p className="text-secondary" style={{ marginBottom: '24px' }}>
          You do not have permission to view this page or your role is not configured.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="btn btn-secondary" onClick={handleBack}>
            Go Back
          </button>
          <button className="btn btn-primary" onClick={() => { logout(); navigate('/login'); }}>
            Sign In with Different Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
