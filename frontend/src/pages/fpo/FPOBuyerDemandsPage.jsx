import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { createRecord } from '../../services/firestore/db';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';

const FPOBuyerDemandsPage = () => {
  const { data: demands, loading } = useCollection('buyerRequirements');
  const { searchQuery } = useSearch();
  const navigate = useNavigate();

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return demands;
    const lowerQuery = searchQuery.toLowerCase();
    return demands.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerQuery))
    );
  }, [demands, searchQuery]);

  const columns = [
    { header: 'Crop', accessor: 'crop' },
    { header: 'Required Qty (kg)', accessor: 'quantity' },
    { header: 'Required By', accessor: 'requiredDate' },
    { header: 'Quality', accessor: 'quality' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status || 'Active'} /> },
    { 
      header: 'Action', 
      render: (row) => (
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => navigate(`/fpo/matches?reqId=${row.id}`)}
        >
          Find Matches
        </button>
      )
    },
  ];

  return (
    <div className="flex-col gap-6">
      <PageHeader title="Buyer Demands" description="Active market requirements from buyers." />
      
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="text-center p-8 text-secondary">Loading demands...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No active buyer demands." />
        )}
      </div>
    </div>
  );
};

export default FPOBuyerDemandsPage;
