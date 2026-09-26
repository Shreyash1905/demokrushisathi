import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { Users, Truck, Briefcase, TrendingUp, Sprout, Store, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useFirestore';
import { createRecord, updateRecord } from '../../services/firestore/db';
import { calculateMatchScore } from '../../utils/matching';

const FPODashboard = () => {
  const [activeTab, setActiveTab] = useState('harvest'); // harvest, buyers

  const { currentUser } = useAuth();
  const fpoId = currentUser?.uid; // Real FPO ID from auth
  const fpoName = currentUser?.displayName || 'Your FPO';

  const { data: members, loading: memLoading } = useCollection('users', [
    { field: 'fpoId', op: '==', value: fpoId },
    { field: 'role', op: '==', value: 'FARMER' }
  ]);
  const { data: harvestListings, loading: harvLoading } = useCollection('harvestListings', [{ field: 'fpoId', op: '==', value: fpoId }]);
  const { data: requirements, loading: reqLoading } = useCollection('buyerRequirements', [{ field: 'status', op: '==', value: 'Active' }]);
  const { data: offers, loading: offLoading } = useCollection('offers', [{ field: 'sellerId', op: '==', value: fpoId }]);
  const { data: transactions, loading: txLoading } = useCollection('transactions', [{ field: 'sellerId', op: '==', value: fpoId }]);

  const handleAcceptOffer = async (offer) => {
    try {
      // 1. Update offer status
      await updateRecord('offers', offer.id, { status: 'ACCEPTED' });
      
      // 2. Create transaction
      const estimatedNet = offer.offeredPrice * offer.quantity * 0.95; // Rough 5% commission/cost mock calculation
      await createRecord('transactions', {
        offerId: offer.id,
        buyerId: offer.buyerId,
        sellerId: fpoId,
        crop: offer.crop,
        quantity: offer.quantity,
        agreedPrice: offer.offeredPrice,
        grossValue: offer.offeredPrice * offer.quantity,
        estimatedNetRealisation: estimatedNet,
        status: 'Initiated'
      });

      // 3. Update harvest listing status
      if (offer.harvestListingId) {
         await updateRecord('harvestListings', offer.harvestListingId, { status: 'Committed' });
      }

      alert('Offer accepted and transaction initiated.');
    } catch (error) {
      alert('Error accepting offer: ' + error.message);
    }
  };

  // Find requirements that match FPO's active harvest listings
  const matchingRequirements = requirements.map(req => {
    let bestMatch = { score: 0, isMatch: false };
    harvestListings.filter(h => h.status !== 'Committed').forEach(h => {
      const match = calculateMatchScore(h, req);
      if (match.score > bestMatch.score) bestMatch = match;
    });
    return {
      ...req,
      matchScore: bestMatch.scoreDisplay,
      isMatch: bestMatch.isMatch
    };
  }).filter(r => r.isMatch).sort((a,b) => parseInt(b.matchScore) - parseInt(a.matchScore));

  const harvestColumns = [
    { header: 'Listing ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Aggregated Qty', accessor: 'quantity' },
    { header: 'Expected Date', accessor: 'expectedDate' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => (
        <button className="btn btn-secondary btn-sm">Manage</button>
      )
    },
  ];

  const demandColumns = [
    { header: 'Requirement ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Required Crop', accessor: 'crop' },
    { header: 'Target Qty', accessor: 'quantity' },
    { header: 'Required By', accessor: 'requiredDate' },
    { 
      header: 'Match Score', 
      render: (row) => (
        <span className="badge" style={{ backgroundColor: 'var(--color-brand-100)', color: 'var(--color-brand-800)' }}>
          {row.matchScore}
        </span>
      ) 
    },
  ];

  const offersColumns = [
    { header: 'Offer ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Qty', accessor: 'quantity' },
    { header: 'Price (₹/kg)', accessor: 'offeredPrice' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => row.status === 'PENDING' ? (
        <button className="btn btn-primary btn-sm" onClick={() => handleAcceptOffer(row)}>Accept</button>
      ) : (
        <span className="text-sm text-secondary">Processed</span>
      )
    },
  ];

  if (harvLoading || reqLoading || offLoading || memLoading || txLoading) {
    return <div className="card text-center p-8">Loading FPO data...</div>;
  }

  const pendingOffers = offers.filter(o => o.status === 'PENDING');

  const expectedHarvest = harvestListings.filter(h => h.status === 'Expected');
  const readyHarvest = harvestListings.filter(h => h.status === 'Ready');
  const activeDeals = transactions.filter(t => t.status === 'Initiated' || t.status === 'In Progress');

  return (
    <div className="flex-col gap-6">
      <PageHeader 
        title="FPO Dashboard" 
        description="Manage members, aggregate produce and connect supply with buyers." 
      />

      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard title="Active Members" value={members.length} icon={Users} />
        <StatCard title="Expected Harvest" value={expectedHarvest.length} icon={Sprout} />
        <StatCard title="Ready for Market" value={readyHarvest.length} icon={Truck} trend="up" trendValue="Actionable" />
        <StatCard title="Active Buyer Demands" value={matchingRequirements.length} icon={Store} />
        <StatCard title="Pending Offers" value={pendingOffers.length} icon={TrendingUp} color="var(--color-warning)" />
        <StatCard title="Active Deals" value={activeDeals.length} icon={FileCheck} />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="flex border-b" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'harvest' ? 'text-brand border-b-2 border-brand' : 'text-secondary'}`}
            style={{ 
              padding: '0.75rem 1rem', 
              borderBottom: activeTab === 'harvest' ? '2px solid var(--color-brand-600)' : '2px solid transparent',
              color: activeTab === 'harvest' ? 'var(--color-brand-700)' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('harvest')}
          >
            Expected Harvest
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'buyers' ? 'text-brand border-b-2 border-brand' : 'text-secondary'}`}
            style={{ 
              padding: '0.75rem 1rem', 
              borderBottom: activeTab === 'buyers' ? '2px solid var(--color-brand-600)' : '2px solid transparent',
              color: activeTab === 'buyers' ? 'var(--color-brand-700)' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('buyers')}
          >
            Buyer Demands
          </button>
          <button 
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'offers' ? 'text-brand border-b-2 border-brand' : 'text-secondary'}`}
            style={{ 
              padding: '0.75rem 1rem', 
              borderBottom: activeTab === 'offers' ? '2px solid var(--color-brand-600)' : '2px solid transparent',
              color: activeTab === 'offers' ? 'var(--color-brand-700)' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('offers')}
          >
            Received Offers ({pendingOffers.length})
          </button>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'harvest' && (
            <div className="flex-col gap-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Aggregated Produce Overview</h2>
              </div>
              <DataTable columns={harvestColumns} data={harvestListings} emptyMessage="No active harvest listings." />
            </div>
          )}
          
          {activeTab === 'buyers' && (
            <div className="flex-col gap-4">
               <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Matching Buyer Requirements</h2>
                <span className="text-sm text-secondary">Based on your expected harvest</span>
              </div>
              <DataTable columns={demandColumns} data={matchingRequirements} emptyMessage="No matching demands right now." />
            </div>
          )}

          {activeTab === 'offers' && (
             <div className="flex-col gap-4">
               <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Inbound Offers</h2>
              </div>
              <DataTable columns={offersColumns} data={offers} emptyMessage="No inbound offers received yet." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FPODashboard;
