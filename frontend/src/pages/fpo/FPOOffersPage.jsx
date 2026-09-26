import React from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { createRecord, updateRecord } from '../../services/firestore/db';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

const FPOOffersPage = () => {
  const { currentUser } = useAuth();
  const fpoId = currentUser?.uid;
  const { data: offers, loading } = useCollection('offers', [{ field: 'sellerId', op: '==', value: fpoId }]);
  const { searchQuery } = useSearch();

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return offers;
    const lowerQuery = searchQuery.toLowerCase();
    return offers.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerQuery))
    );
  }, [offers, searchQuery]);

  const handleOfferAction = async (offer, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this offer?`)) return;

    try {
      if (action === 'Accept') {
        // Update Offer Status
        await updateRecord('offers', offer.id, { status: 'Accepted' });

        // Create Transaction
        await createRecord('transactions', {
          offerId: offer.id,
          listingId: offer.listingId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          crop: offer.crop,
          quantity: offer.quantity,
          agreedPrice: offer.offeredPrice,
          totalValue: Number(offer.quantity) * Number(offer.offeredPrice),
          status: 'In Progress'
        });

        alert("Offer accepted! A transaction has been created.");
      } else if (action === 'Reject') {
        await updateRecord('offers', offer.id, { status: 'Rejected' });
      }
    } catch (err) {
      alert("Error processing offer: " + err.message);
    }
  };

  const columns = [
    { header: 'Offer ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Crop', accessor: 'crop' },
    { header: 'Quantity (kg)', accessor: 'quantity' },
    { header: 'Price/kg', accessor: 'offeredPrice', render: (row) => `₹${row.offeredPrice}` },
    { header: 'Date', render: (row) => row.createdAt ? new Date(row.createdAt?.seconds * 1000).toLocaleDateString() : 'N/A' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => row.status === 'Pending' ? (
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => handleOfferAction(row, 'Accept')}>Accept</button>
          <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleOfferAction(row, 'Reject')}>Reject</button>
        </div>
      ) : (
        <span className="text-secondary text-sm">-</span>
      )
    },
  ];

  return (
    <div className="flex-col gap-6">
      <PageHeader title="Inbound Offers" description="Review and manage offers from buyers." />
      
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="text-center p-8 text-secondary">Loading offers...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No offers received yet." />
        )}
      </div>
    </div>
  );
};

export default FPOOffersPage;
