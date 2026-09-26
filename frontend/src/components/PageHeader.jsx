import React from 'react';
import './PageHeader.css';

const PageHeader = ({ title, description, children }) => {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-secondary">{description}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
};

export default PageHeader;
