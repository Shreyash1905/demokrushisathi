import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { createRecord, updateRecord } from '../../services/firestore/db';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const FPOMembersPage = () => {
  const { currentUser } = useAuth();
  const fpoId = currentUser?.uid;
  
  const { data: members, loading } = useCollection('fpoMembers', [{ field: 'fpoId', op: '==', value: fpoId }]);
  const { searchQuery } = useSearch();

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return members;
    const lowerQuery = searchQuery.toLowerCase();
    return members.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerQuery))
    );
  }, [members, searchQuery]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // First check if email already exists in fpoMembers
      const existing = members.find(m => m.email === formData.email);
      if (existing) {
        throw new Error("A member with this email already exists.");
      }

      await createRecord('fpoMembers', {
        fpoId,
        role: 'FARMER',
        ...formData
      });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', location: '', status: 'ACTIVE' });
    } catch (err) {
      alert("Error adding member: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member) => {
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (window.confirm(`Are you sure you want to mark this member as ${newStatus}?`)) {
      await updateRecord('fpoMembers', member.id, { status: newStatus });
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email/Phone', render: (row) => row.email || row.phone },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => (
        <button className="btn btn-secondary btn-sm" onClick={() => handleToggleStatus(row)}>
          {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </button>
      )
    },
  ];

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader title="FPO Members" description="Manage your farmer members." />
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Member</button>
      </div>
      
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="text-center p-8 text-secondary">Loading members...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No members found." />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Member">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Ramesh Gowda" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ramesh@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="text" className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input type="text" className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g., Sagara" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FPOMembersPage;
