import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { createRecord, updateRecord } from '../../services/firestore/db';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

const BuyerRequirementsPage = () => {
  const { currentUser } = useAuth();
  const buyerId = currentUser?.uid;
  const { data: requirements, loading } = useCollection('buyerRequirements', [{ field: 'buyerId', op: '==', value: buyerId }]);
  const { searchQuery } = useSearch();

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return requirements;
    const lowerQuery = searchQuery.toLowerCase();
    return requirements.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerQuery))
    );
  }, [requirements, searchQuery]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    crop: 'Arecanut (Rashi)',
    quantity: '',
    requiredDate: '',
    location: '',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRecord('buyerRequirements', {
        buyerId,
        ...formData,
      });
      setIsModalOpen(false);
      setFormData({ crop: 'Arecanut (Rashi)', quantity: '', requiredDate: '', location: '', status: 'Active' });
    } catch (err) {
      alert("Error saving requirement: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseReq = async (id) => {
    if (window.confirm("Close this requirement?")) {
      await updateRecord('buyerRequirements', id, { status: 'Closed' });
    }
  };

  const columns = [
    { header: 'Req ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Quantity (kg)', accessor: 'quantity' },
    { header: 'Required Date', accessor: 'requiredDate' },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => row.status === 'Active' ? (
        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleCloseReq(row.id)}>Close</button>
      ) : (
        <span className="text-secondary text-sm">-</span>
      )
    },
  ];

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader title="My Requirements" description="Manage your procurement demands." />
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Requirement</button>
      </div>
      
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="text-center p-8 text-secondary">Loading requirements...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No active requirements found." />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Requirement">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Crop & Variety</label>
            <select className="form-input" value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})}>
              <option>Arecanut (Rashi)</option>
              <option>Arecanut (Chali)</option>
              <option>Black Pepper (Malabar Garbled)</option>
              <option>Paddy (Jyothi)</option>
              <option>Paddy (Sona Masuri)</option>
              <option>Coffee (Robusta Cherry)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Required Quantity (kg)</label>
            <input required type="number" className="form-input" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="5000" />
          </div>
          <div className="form-group">
            <label className="form-label">Required Date</label>
            <input required type="date" className="form-input" value={formData.requiredDate} onChange={e => setFormData({...formData, requiredDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Location Preferred</label>
            <input type="text" className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g., Sagara" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish Requirement'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BuyerRequirementsPage;
