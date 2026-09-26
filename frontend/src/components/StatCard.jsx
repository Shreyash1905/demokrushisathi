import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'var(--color-brand-600)' }) => {
  return (
    <div className="stat-card card">
      <div className="stat-card-header">
        <h3 className="stat-title text-secondary">{title}</h3>
        {Icon && (
          <div className="stat-icon" style={{ color }}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-value text-2xl font-bold">{value}</div>
        {trend && (
          <div className={`stat-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
