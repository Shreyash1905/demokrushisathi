import React from 'react';
import { useCollection } from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const GenericListPage = ({ title, description, collectionName, columns, filterByFpoId = false, filterByBuyerId = false, filterBySellerId = false, customFilters = [] }) => {
  const { currentUser } = useAuth();
  
  let filters = [...customFilters];
  if (filterByFpoId && currentUser) {
    filters.push({ field: 'fpoId', op: '==', value: currentUser.uid });
  }
  if (filterByBuyerId && currentUser) {
    filters.push({ field: 'buyerId', op: '==', value: currentUser.uid });
  }
  if (filterBySellerId && currentUser) {
    filters.push({ field: 'sellerId', op: '==', value: currentUser.uid });
  }

  const { data, loading } = useCollection(collectionName, filters);
  const { searchQuery } = useSearch();

  // Filter data client-side based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      );
    });
  }, [data, searchQuery]);

  // Pre-process columns to add standard renderers if not provided
  const processedColumns = columns.map(col => {
    if (col.accessor === 'status' && !col.render) {
      return { ...col, render: (row) => <StatusBadge status={row.status} /> };
    }
    if ((col.accessor === 'createdAt' || col.accessor === 'updatedAt') && !col.render) {
      return { ...col, render: (row) => row[col.accessor] ? new Date(row[col.accessor]?.seconds * 1000).toLocaleDateString() : 'N/A' };
    }
    if (col.accessor === 'id' && !col.render) {
      return { ...col, render: (row) => row.id.slice(0, 8).toUpperCase() };
    }
    return col;
  });

  return (
    <div className="flex-col gap-6">
      <PageHeader title={title} description={description} />
      
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="text-center p-8 text-secondary">Loading {title.toLowerCase()}...</div>
        ) : (
          <DataTable 
            columns={processedColumns} 
            data={filteredData} 
            emptyMessage={searchQuery ? `No ${title.toLowerCase()} found matching "${searchQuery}".` : `No ${title.toLowerCase()} found.`} 
          />
        )}
      </div>
    </div>
  );
};

export default GenericListPage;
