import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { createRecord, updateRecord } from '../../services/firestore/db';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

const FPOHarvestPage = () => {
  const { currentUser } = useAuth();
  const fpoId = currentUser?.uid;
  const { data: harvestListings, loading } = useCollection('harvestListings', [{ field: 'fpoId', op: '==', value: fpoId }]);
  const { searchQuery } = useSearch();

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return harvestListings;
    const lowerQuery = searchQuery.toLowerCase();
    return harvestListings.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerQuery))
    );
  }, [harvestListings, searchQuery]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHarvest, setSelectedHarvest] = useState(null);
  const [formData, setFormData] = useState({
    crop: 'Arecanut (Rashi)',
    quantity: '',
    expectedDate: '',
    status: 'Expected'
  });
  const [editFormData, setEditFormData] = useState({
    crop: '',
    quantity: '',
    expectedDate: '',
    status: 'Expected'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRecord('harvestListings', {
        fpoId,
        ...formData,
        farmers: 0, // Mock for now
      });
      setIsModalOpen(false);
      setFormData({ crop: 'Arecanut (Rashi)', quantity: '', expectedDate: '', status: 'Expected' });
    } catch (err) {
      alert("Error saving harvest: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManage = (harvest) => {
    setSelectedHarvest(harvest);
    setEditFormData({
      crop: harvest.crop,
      quantity: harvest.quantity,
      expectedDate: harvest.expectedDate,
      status: harvest.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateRecord('harvestListings', selectedHarvest.id, editFormData);
      setIsEditModalOpen(false);
      setSelectedHarvest(null);
    } catch (err) {
      alert("Error updating harvest: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Listing ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Quantity (kg)', accessor: 'quantity' },
    { header: 'Expected Date', accessor: 'expectedDate' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => row.status === 'Expected' || row.status === 'Aggregating' || row.status === 'Available' ? (
        <button className="btn btn-primary btn-sm" onClick={() => handleManage(row)}>Manage</button>
      ) : (
        <span className="text-secondary text-sm">Completed</span>
      )
    },
  ];

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader title="Harvest Management" description="Manage aggregated member harvest." />
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Harvest Listing</button>
      </div>
      
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="text-center p-8 text-secondary">Loading harvest data...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No active harvest listings." />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Harvest Listing">
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
            <label className="form-label">Expected Quantity (kg)</label>
            <input required type="number" className="form-input" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="5000" />
          </div>
          <div className="form-group">
            <label className="form-label">Expected Date</label>
            <input required type="date" className="form-input" value={formData.expectedDate} onChange={e => setFormData({...formData, expectedDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="Expected">Expected</option>
              <option value="Ready">Ready for Market</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Harvest Listing'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Manage Harvest">
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Crop & Variety</label>
            <select className="form-input" value={editFormData.crop} onChange={e => setEditFormData({...editFormData, crop: e.target.value})}>
              <option>Arecanut (Rashi)</option>
              <option>Arecanut (Chali)</option>
              <option>Black Pepper (Malabar Garbled)</option>
              <option>Paddy (Jyothi)</option>
              <option>Paddy (Sona Masuri)</option>
              <option>Coffee (Robusta Cherry)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity (kg)</label>
            <input required type="number" className="form-input" value={editFormData.quantity} onChange={e => setEditFormData({...editFormData, quantity: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Expected Date</label>
            <input required type="date" className="form-input" value={editFormData.expectedDate} onChange={e => setEditFormData({...editFormData, expectedDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
              <option value="Expected">Expected</option>
              <option value="Aggregating">Aggregating</option>
              <option value="Available">Ready / Available</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Harvest'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FPOHarvestPage;
