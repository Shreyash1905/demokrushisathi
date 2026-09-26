import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { FileText, Store, Plus, ArrowRight } from 'lucide-react';
import { useCollection } from '../../hooks/useFirestore';
import { createRecord } from '../../services/firestore/db';
import { calculateMatchScore } from '../../utils/matching';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BuyerDashboard = () => {
  const { currentUser } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReq, setNewReq] = useState({
    crop: 'Arecanut (Rashi)',
    quantity: '',
    requiredDate: '',
    additionalRequirements: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const buyerId = currentUser?.uid;

  const { data: requirements, loading: reqLoading } = useCollection('buyerRequirements', [{ field: 'buyerId', op: '==', value: buyerId }]);
  const { data: harvests, loading: harvLoading } = useCollection('harvestListings', [{ field: 'status', op: 'in', value: ['Available', 'Aggregating', 'Ready for Market'] }]);
  const { data: offers, loading: offLoading } = useCollection('offers', [{ field: 'buyerId', op: '==', value: buyerId }]);
  const { data: transactions, loading: txLoading } = useCollection('transactions', [{ field: 'buyerId', op: '==', value: buyerId }]);

  const handleCreateRequirement = async () => {
    if (!newReq.quantity || !newReq.requiredDate) return alert("Please fill required fields.");
    setSubmitting(true);
    try {
      await createRecord('buyerRequirements', {
        ...newReq,
        buyerId,
        status: 'Active',
      });
      setShowCreateModal(false);
      setNewReq({ crop: 'Arecanut (Rashi)', quantity: '', requiredDate: '', additionalRequirements: '' });
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOffer = async (supply) => {
    try {
      await createRecord('offers', {
        buyerId,
        sellerId: supply.fpoId,
        harvestListingId: supply.id,
        crop: supply.crop,
        quantity: supply.quantity,
        status: 'PENDING',
        offeredPrice: 0 // to be negotiated or input
      });
      alert('Offer initiated successfully.');
    } catch(err) {
      alert('Failed: ' + err.message);
    }
  }

  // Calculate Matches
  const matchedSupply = harvests.map(h => {
    // Find if it matches any active requirement
    let bestMatch = { score: 0, isMatch: false };
    requirements.filter(r => r.status === 'Active').forEach(req => {
      const match = calculateMatchScore(h, req);
      if (match.score > bestMatch.score) bestMatch = match;
    });

    return {
      ...h,
      matchScore: bestMatch.scoreDisplay,
      isMatch: bestMatch.isMatch
    };
  }).filter(h => h.isMatch).sort((a,b) => parseInt(b.matchScore) - parseInt(a.matchScore));

  const reqColumns = [
    { header: 'Requirement ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Target Qty', accessor: 'quantity' },
    { header: 'Required By', accessor: 'requiredDate' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => (
        <button 
          className="btn btn-secondary btn-sm flex items-center gap-1"
          onClick={() => navigate(`/buyer/supply?reqId=${row.id}`)}
        >
          View Matches <ArrowRight size={14} />
        </button>
      )
    },
  ];

  const supplyColumns = [
    { header: 'Supplier', accessor: 'fpoName' },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Available Qty', accessor: 'quantity' },
    { header: 'Expected Date', accessor: 'expectedDate' },
    { 
      header: 'Match Score', 
      render: (row) => (
        <span className="badge" style={{ backgroundColor: 'var(--color-brand-100)', color: 'var(--color-brand-800)' }}>
          {row.matchScore}
        </span>
      ) 
    },
    { 
      header: 'Action', 
      render: (row) => (
        <button className="btn btn-primary btn-sm" onClick={() => handleCreateOffer(row)}>Initiate Offer</button>
      )
    },
  ];

  if (reqLoading || harvLoading || offLoading || txLoading) {
    return <div className="card text-center p-8">Loading buyer data...</div>;
  }

  const activeReqs = requirements.filter(r => r.status === 'Active');
  const totalVolume = activeReqs.reduce((sum, req) => sum + (Number(req.quantity) || 0), 0);

  return (
    <div className="flex-col gap-6 relative">
      <PageHeader 
        title="Procurement Dashboard" 
        description="Manage your requirements and discover matching supply from FPOs." 
      >
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          New Requirement
        </button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard title="Active Requirements" value={activeReqs.length} icon={FileText} />
        <StatCard title="Total Required Vol." value={`${totalVolume.toLocaleString()} kg`} icon={Store} />
        <StatCard title="Pending Offers" value={offers.filter(o => o.status === 'PENDING').length} icon={FileText} color="var(--color-warning)" />
        <StatCard title="Completed Tx" value={transactions.length} icon={Store} color="var(--color-success)" />
      </div>

      <div className="flex-col gap-6">
        <div className="card flex-col gap-4">
          <h2 className="text-lg font-bold">Your Requirements</h2>
          <DataTable columns={reqColumns} data={requirements} emptyMessage="No requirements created yet." />
        </div>

        <div className="card flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Top Matching Supply</h2>
              <p className="text-sm text-secondary">Based on your active requirements</p>
            </div>
          </div>
          <DataTable columns={supplyColumns} data={matchedSupply} emptyMessage="No matching supply found at this time." />
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white' }}>
            <h2 className="text-xl font-bold mb-4">Create New Requirement</h2>
            
            <div className="form-group">
              <label className="form-label">Crop Type</label>
              <select className="form-input mb-3" value={newReq.crop} onChange={e => setNewReq({...newReq, crop: e.target.value})}>
                <option>Arecanut (Rashi)</option>
                <option>Arecanut (Chali)</option>
                <option>Black Pepper (Malabar Garbled)</option>
                <option>Paddy (Jyothi)</option>
                <option>Paddy (Sona Masuri)</option>
                <option>Coffee (Robusta Cherry)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="form-group">
                <label className="form-label">Quantity (kg)</label>
                <input type="number" className="form-input" placeholder="e.g. 5000" value={newReq.quantity} onChange={e => setNewReq({...newReq, quantity: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Required By Date</label>
                <input type="date" className="form-input" value={newReq.requiredDate} onChange={e => setNewReq({...newReq, requiredDate: e.target.value})} />
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Additional Quality Requirements</label>
              <textarea className="form-input" rows="3" placeholder="e.g. Moisture content below 10%..." value={newReq.additionalRequirements} onChange={e => setNewReq({...newReq, additionalRequirements: e.target.value})}></textarea>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateRequirement} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Requirement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
