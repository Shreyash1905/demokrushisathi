import React, { useState } from 'react';
import { useCollection, useDocument } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { createRecord } from '../../services/firestore/db';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useSearchParams, useNavigate } from 'react-router-dom';

const FPOMatchesPage = () => {
  const { currentUser } = useAuth();
  const fpoId = currentUser?.uid;
  const [searchParams] = useSearchParams();
  const reqId = searchParams.get('reqId');
  const navigate = useNavigate();

  // Load active requirements
  const { data: requirements, loading: reqLoading } = useCollection('buyerRequirements');
  // Load this FPO's active harvest listings
  const { data: harvests, loading: harvLoading } = useCollection('harvestListings', [{ field: 'fpoId', op: '==', value: fpoId }]);
  
  const { searchQuery } = useSearch();

  const matches = React.useMemo(() => {
    if (!requirements || !harvests) return [];
    
    let targetReqs = requirements;
    if (reqId) {
      targetReqs = requirements.filter(r => r.id === reqId);
    }

    const computedMatches = [];
    
    targetReqs.forEach(req => {
      harvests.forEach(harv => {
        // Deterministic matching rules
        if (req.crop.toLowerCase() === harv.crop.toLowerCase()) {
          // Check if quantity is somewhat sufficient (e.g. at least 50% of what's required)
          const reqQty = Number(req.quantity);
          const harvQty = Number(harv.quantity);
          
          if (harvQty > 0) {
            computedMatches.push({
              id: `${req.id}_${harv.id}`,
              requirementId: req.id,
              harvestListingId: harv.id,
              buyerId: req.buyerId,
              fpoId: harv.fpoId,
              crop: req.crop,
              reqQuantity: reqQty,
              harvQuantity: harvQty,
              reqDate: req.requiredDate,
              harvDate: harv.expectedDate,
              status: 'Matched'
            });
          }
        }
      });
    });

    return computedMatches;
  }, [requirements, harvests, reqId]);

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return matches;
    const lowerQuery = searchQuery.toLowerCase();
    return matches.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerQuery))
    );
  }, [matches, searchQuery]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleMakeOffer = (match) => {
    setSelectedMatch(match);
    setOfferPrice('');
    setIsModalOpen(true);
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRecord('offers', {
        requirementId: selectedMatch.requirementId,
        harvestListingId: selectedMatch.harvestListingId,
        buyerId: selectedMatch.buyerId,
        sellerId: fpoId,
        crop: selectedMatch.crop,
        quantity: selectedMatch.harvQuantity,
        price: Number(offerPrice),
        status: 'Pending'
      });
      setIsModalOpen(false);
      alert('Offer submitted successfully.');
      navigate('/fpo/offers');
    } catch (err) {
      alert("Error submitting offer: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Crop', accessor: 'crop' },
    { header: 'Buyer Needs (kg)', accessor: 'reqQuantity' },
    { header: 'Your Supply (kg)', accessor: 'harvQuantity' },
    { header: 'Required By', accessor: 'reqDate' },
    { header: 'Expected Harvest', accessor: 'harvDate' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => (
        <button className="btn btn-primary btn-sm" onClick={() => handleMakeOffer(row)}>Make Offer</button>
      )
    },
  ];

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader 
          title="Matches" 
          description={reqId ? "Matching supply for selected demand." : "All potential market matches."} 
        />
        {reqId && (
          <button className="btn btn-secondary" onClick={() => navigate('/fpo/demands')}>Back to Demands</button>
        )}
      </div>
      
      <div className="card" style={{ padding: '1.5rem' }}>
        {reqLoading || harvLoading ? (
          <div className="text-center p-8 text-secondary">Calculating matches...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No matching supply found." />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Make Offer to Buyer">
        <form onSubmit={submitOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Crop</label>
            <input type="text" className="form-input" disabled value={selectedMatch?.crop || ''} />
          </div>
          <div className="form-group">
            <label className="form-label">Quantity Available (kg)</label>
            <input type="text" className="form-input" disabled value={selectedMatch?.harvQuantity || ''} />
          </div>
          <div className="form-group">
            <label className="form-label">Your Price (₹ per kg)</label>
            <input 
              required 
              type="number" 
              className="form-input" 
              value={offerPrice} 
              onChange={e => setOfferPrice(e.target.value)} 
              placeholder="e.g., 50" 
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Offer'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FPOMatchesPage;
