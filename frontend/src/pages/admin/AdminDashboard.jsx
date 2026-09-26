import React from 'react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { Users, Sprout, TrendingUp, AlertTriangle, FileCheck } from 'lucide-react';
import { useCollection } from '../../hooks/useFirestore';

const AdminDashboard = () => {
  const { data: farmers, loading: loadingFarmers } = useCollection('farmers');
  const { data: fpos, loading: loadingFpos } = useCollection('fpos', [{ field: 'status', op: '==', value: 'Active' }]);
  const { data: buyers, loading: loadingBuyers } = useCollection('users', [{ field: 'role', op: '==', value: 'BUYER' }]);
  const { data: expertCases, loading: loadingCases } = useCollection('expertCases', [{ field: 'status', op: '==', value: 'Open' }]);
  const { data: transactions, loading: loadingTx } = useCollection('transactions');

  const columns = [
    { header: 'Type', accessor: 'type' },
    { header: 'Details', accessor: 'details' },
    { 
      header: 'Date', 
      render: (row) => row.createdAt ? new Date(row.createdAt?.seconds * 1000).toLocaleDateString() : 'N/A' 
    },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (loadingFarmers || loadingFpos || loadingBuyers || loadingCases || loadingTx) {
    return <div className="card text-center p-8">Loading dashboard data...</div>;
  }

  return (
    <div className="flex-col gap-6">
      <PageHeader 
        title="Admin Overview" 
        description="Monitor system-wide activity and platform health." 
      />

      <div className="grid grid-cols-5 gap-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard 
          title="Total Farmers" 
          value={farmers.length || '0'} 
          icon={Users} 
          trend="up" 
          trendValue="Live"
        />
        <StatCard 
          title="Active FPOs" 
          value={fpos.length || '0'} 
          icon={Sprout} 
        />
        <StatCard 
          title="Registered Buyers" 
          value={buyers.length || '0'} 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Open Expert Cases" 
          value={expertCases.length || '0'} 
          icon={AlertTriangle} 
          color="var(--color-warning)"
        />
        <StatCard 
          title="Active Transactions" 
          value={transactions.length || '0'} 
          icon={FileCheck} 
          trend="up"
          trendValue="Live"
        />
      </div>

    </div>
  );
};

export default AdminDashboard;
