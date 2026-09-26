import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useSearch } from '../../context/SearchContext';
import { updateRecord } from '../../services/firestore/db';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

const ExpertCasesPage = () => {
  const { data: cases, loading } = useCollection('expertCases');
  const { searchQuery } = useSearch();

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return cases;
    const lowerQuery = searchQuery.toLowerCase();
    return cases.filter(row => 
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerQuery))
    );
  }, [cases, searchQuery]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [formData, setFormData] = useState({
    finalDiagnosis: '',
    recommendation: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleReview = (c) => {
    setSelectedCase(c);
    setFormData({ finalDiagnosis: '', recommendation: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateRecord('expertCases', selectedCase.id, {
        finalDiagnosis: formData.finalDiagnosis,
        recommendation: formData.recommendation,
        status: 'Resolved'
      });
      setIsModalOpen(false);
      setSelectedCase(null);
      alert("Case validated and resolved!");
    } catch (err) {
      alert("Error resolving case: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'Case ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Farmer', accessor: 'farmerName' },
    { header: 'Crop', accessor: 'crop' },
    { header: 'AI Observation', accessor: 'aiObservation' },
    { header: 'Confidence', accessor: 'confidence' },
    { header: 'Severity', render: (row) => <StatusBadge status={row.severity} /> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => row.status !== 'Resolved' ? (
        <button className="btn btn-primary btn-sm" onClick={() => handleReview(row)}>Review</button>
      ) : (
        <span className="text-secondary text-sm">Resolved</span>
      )
    },
  ];

  return (
    <div className="flex-col gap-6">
      <PageHeader title="Expert Cases" description="Review AI observations and provide human validation." />
      
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div className="text-center p-8 text-secondary">Loading cases...</div>
        ) : (
          <DataTable columns={columns} data={filteredData} emptyMessage="No cases found." />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Review Case: ${selectedCase?.id.slice(0,8).toUpperCase()}`}>
        {selectedCase && (
          <div className="mb-4" style={{ marginBottom: '16px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
            <p><strong>Farmer:</strong> {selectedCase.farmerName} ({selectedCase.location})</p>
            <p><strong>Crop:</strong> {selectedCase.crop}</p>
            <p><strong>AI Observation:</strong> {selectedCase.aiObservation} ({selectedCase.confidence} confidence)</p>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Expert Diagnosis</label>
            <input required type="text" className="form-input" value={formData.finalDiagnosis} onChange={e => setFormData({...formData, finalDiagnosis: e.target.value})} placeholder="e.g., Confirmed Nut Rot" />
          </div>
          <div className="form-group">
            <label className="form-label">Treatment Recommendation</label>
            <textarea required className="form-input" value={formData.recommendation} onChange={e => setFormData({...formData, recommendation: e.target.value})} placeholder="Prescribe actionable steps for the farmer..." rows={3} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Resolving...' : 'Validate & Resolve Case'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ExpertCasesPage;
