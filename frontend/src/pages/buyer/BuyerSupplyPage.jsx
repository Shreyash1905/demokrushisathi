import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { createRecord } from '../../services/firestore/db';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useSearchParams, useNavigate } from 'react-router-dom';

const BuyerSupplyPage = () => {
  const { currentUser } = useAuth();
  const buyerId = currentUser?.uid;
  const [searchParams] = useSearchParams();
  const reqId = searchParams.get('reqId');
  const navigate = useNavigate();
  // Show available harvest listings
  const { data: allSupply, loading: harvLoading } = useCollection('harvestListings');
  const { data: requirements, loading: reqLoading } = useCollection('buyerRequirements', [{ field: 'buyerId', op: '==', value: buyerId }]);
  const { searchQuery } = useSearch();

  const supply = React.useMemo(() => {
    if (!allSupply || !requirements) return [];
    
    if (reqId) {
      const targetReq = requirements.find(r => r.id === reqId);
      if (!targetReq) return [];
      
      // Filter supply matching the requirement's crop
      return allSupply.filter(harv => 
        harv.crop.toLowerCase() === targetReq.crop.toLowerCase() && 
        Number(harv.quantity) > 0
      );
    }
    
    return allSupply;
  }, [allSupply, requirements, reqId]);

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return supply;
    const lowerQuery = searchQuery.toLowerCase();
    return supply.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerQuery))
    );
  }, [supply, searchQuery]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  
  const [formData, setFormData] = useState({
    offeredPrice: '',
    quantity: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInitiateOffer = (listing) => {
    setSelectedListing(listing);
    setFormData({ offeredPrice: '', quantity: listing.quantity, notes: '' });
    setIsModalOpen(true);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRecord('offers', {
        buyerId,
        sellerId: selectedListing.fpoId,
        listingId: selectedListing.id,
        crop: selectedListing.crop,
        ...formData,
        status: 'Pending'
      });
      setIsModalOpen(false);
      setSelectedListing(null);
      alert("Offer sent successfully to the FPO!");
    } catch (err) {
      alert("Error sending offer: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Listing ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Quantity Available (kg)', accessor: 'quantity' },
    { header: 'Expected Date', accessor: 'expectedDate' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => row.status === 'Ready' || row.status === 'Available' ? (
        <button className="btn btn-primary btn-sm" onClick={() => handleInitiateOffer(row)}>Make Offer</button>
      ) : (
        <span className="text-secondary text-sm">Unavailable</span>
      )
    },
  ];

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader 
          title="Discover Supply" 
          description={reqId ? "Matching supply for selected requirement." : "Browse available harvest from verified FPOs and initiate offers."} 
        />
        {reqId && (
          <button className="btn btn-secondary" onClick={() => navigate('/buyer/requirements')}>Back to Requirements</button>
        )}
      </div>
      
      <div className="card" style={{ padding: '1.5rem' }}>
        {harvLoading || reqLoading ? (
          <div className="text-center p-8 text-secondary">Loading supply data...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No active supply found." />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Make Offer for ${selectedListing?.crop}`}>
        <form onSubmit={handleSubmitOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Offered Quantity (kg)</label>
            <input required type="number" className="form-input" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            <span className="text-xs text-secondary mt-1">Maximum available: {selectedListing?.quantity} kg</span>
          </div>
          <div className="form-group">
            <label className="form-label">Price per kg (₹)</label>
            <input required type="number" className="form-input" value={formData.offeredPrice} onChange={e => setFormData({...formData, offeredPrice: e.target.value})} placeholder="e.g., 450" />
          </div>
          <div className="form-group">
            <label className="form-label">Terms / Notes</label>
            <textarea className="form-input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any specific requirements regarding quality, transport..." rows={3} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Sending Offer...' : 'Send Offer to FPO'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BuyerSupplyPage;
