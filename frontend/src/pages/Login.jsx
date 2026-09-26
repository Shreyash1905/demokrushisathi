import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Lock, Mail } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { role } = await login(email, password);
      
      // Determine redirect path based on Firestore role
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'EXPERT') navigate('/expert');
      else if (role === 'FPO') navigate('/fpo');
      else if (role === 'BUYER') navigate('/buyer');
      else {
        // If authentication succeeds but no valid role exists in Firestore users/{uid}
        // Either Firestore isn't setup, or the user document is missing/invalid.
        setError('Login successful, but your account lacks a valid role in the database. Please contact the administrator.');
      }
      
    } catch (err) {
      if (err.message && err.message.includes('Missing or insufficient permissions')) {
        setError('Firestore Security Rules are blocking access. Go to Firebase Console -> Firestore Database -> Rules, and set "allow read, write: if true;" temporarily to test.');
      } else {
        setError(err.message || 'Failed to login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('demo123');
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="login-header">
          <div className="logo justify-center">
            <Leaf className="logo-icon" size={32} />
            <span className="logo-text text-2xl">Krushi Sathi</span>
          </div>
          <p className="text-secondary text-sm">Sign in to your dashboard</p>
        </div>

        {error && <div className="login-error badge badge-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-accounts">
          <p className="text-xs text-tertiary">Demo Accounts:</p>
          <div className="demo-buttons">
            <button onClick={() => setDemoAccount('admin@krushisathi.in')} type="button" className="badge badge-neutral">Admin</button>
            <button onClick={() => setDemoAccount('expert@krushisathi.in')} type="button" className="badge badge-neutral">Expert</button>
            <button onClick={() => setDemoAccount('fpo@krushisathi.in')} type="button" className="badge badge-neutral">FPO</button>
            <button onClick={() => setDemoAccount('buyer@krushisathi.in')} type="button" className="badge badge-neutral">Buyer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
