import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, CheckCircle, FileCheck, Info } from 'lucide-react';
import { useCollection } from '../../hooks/useFirestore';
import { createRecord, updateRecord } from '../../services/firestore/db';
import { useAuth } from '../../context/AuthContext';
import './ExpertDashboard.css';

const ExpertDashboard = () => {
  const { currentUser } = useAuth();
  const [selectedCase, setSelectedCase] = useState(null);
  const [validationDiagnosis, setValidationDiagnosis] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: cases, loading } = useCollection('expertCases', [], { field: 'createdAt', direction: 'desc' });

  const openCases = cases.filter(c => c.status === 'Open');
  const priorityCases = cases.filter(c => c.severity === 'High' && c.status === 'Open');
  const resolvedCases = cases.filter(c => c.status === 'Resolved');

  const columns = [
    { header: 'Case ID', render: (row) => row.id.slice(0,8).toUpperCase() },
    { header: 'Farmer', accessor: 'farmerName' },
    { header: 'Crop', accessor: 'crop' },
    { header: 'AI Observation', accessor: 'aiObservation' },
    { header: 'Severity', render: (row) => <StatusBadge status={row.severity} /> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => (
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setSelectedCase(row)}
        >
          Review
        </button>
      )
    },
  ];

  const handleSubmitValidation = async () => {
    if (!validationDiagnosis) {
      alert('Please select a diagnosis confirmation.');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Add to expertValidations
      await createRecord('expertValidations', {
        caseId: selectedCase.id,
        diagnosis: validationDiagnosis,
        recommendation: recommendation,
        expertId: currentUser?.uid,
      });

      // 2. Update the case status
      await updateRecord('expertCases', selectedCase.id, {
        status: 'Resolved',
        finalDiagnosis: validationDiagnosis,
      });

      setSelectedCase(null);
      setValidationDiagnosis('');
      setRecommendation('');
    } catch (error) {
      alert('Failed to submit validation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="card text-center p-8">Loading expert cases...</div>;

  return (
    <div className="flex-col gap-6 relative">
      <PageHeader 
        title="Expert Dashboard" 
        description="Review AI observations and provide human validation for crop health cases." 
      />

      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.5rem' }}>
        <StatCard title="Open Cases" value={openCases.length} icon={FileCheck} />
        <StatCard title="Priority Cases" value={priorityCases.length} icon={AlertTriangle} color="var(--color-error)" />
        <StatCard title="Resolved" value={resolvedCases.length} icon={CheckCircle} color="var(--color-success)" />
        <StatCard title="Avg Response Time" value="4.2 hrs" icon={Info} color="var(--color-info)" />
      </div>

      <div className="flex-col gap-4">
        <h2 className="text-lg font-bold">Cases Awaiting Validation</h2>
        <DataTable columns={columns} data={openCases} emptyMessage="No cases awaiting validation." />
      </div>

      {selectedCase && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 className="text-xl font-bold">Review Case: {selectedCase.id.slice(0,8).toUpperCase()}</h2>
              <button className="btn-icon" onClick={() => setSelectedCase(null)}>×</button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex-col gap-4">
                <div className="info-block">
                  <h3 className="text-sm text-secondary font-bold mb-1">Farmer Context</h3>
                  <p className="text-sm"><strong>Name:</strong> {selectedCase.farmerName || 'N/A'}</p>
                  <p className="text-sm"><strong>Location:</strong> {selectedCase.location || 'N/A'}</p>
                  <p className="text-sm"><strong>Crop:</strong> {selectedCase.crop}</p>
                </div>
                
                <div className="info-block" style={{ backgroundColor: 'var(--color-brand-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-brand-200)' }}>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--color-brand-800)', marginBottom: '0.5rem' }}>AI OBSERVATION</h3>
                  <p className="text-sm"><strong>Diagnosis:</strong> {selectedCase.aiObservation}</p>
                  <p className="text-sm"><strong>Confidence:</strong> {selectedCase.confidence || 'N/A'}</p>
                  <p className="text-sm flex items-center gap-2"><strong>Severity:</strong> <StatusBadge status={selectedCase.severity} /></p>
                </div>

                <div className="image-placeholder bg-gray-100 rounded-md flex items-center justify-center" style={{ height: '200px', backgroundColor: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)' }}>
                  {selectedCase.imageUrl ? (
                    <img src={selectedCase.imageUrl} alt="Crop" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  ) : (
                    <span className="text-tertiary text-sm">[ No Image Provided ]</span>
                  )}
                </div>
              </div>

              <div className="flex-col gap-4">
                <div className="info-block" style={{ border: '1px solid var(--border-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h3 className="text-sm font-bold mb-2">EXPERT VALIDATION</h3>
                  <div className="form-group">
                    <label className="form-label">Diagnosis Confirmation</label>
                    <select 
                      className="form-input mb-3"
                      value={validationDiagnosis}
                      onChange={(e) => setValidationDiagnosis(e.target.value)}
                    >
                      <option value="">Select Validation...</option>
                      <option value={`Agree with AI (${selectedCase.aiObservation})`}>Agree with AI ({selectedCase.aiObservation})</option>
                      <option value="Disagree - Provide New Diagnosis">Disagree - Provide New Diagnosis</option>
                      <option value="Inconclusive - Need Better Image">Inconclusive - Need Better Image</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expert Recommendation / Action Plan</label>
                    <textarea 
                      className="form-input" 
                      rows="4" 
                      placeholder="Enter treatment plan, chemical dosage, or agronomic advice..."
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="flex gap-2 justify-end" style={{ marginTop: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedCase(null)} disabled={submitting}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSubmitValidation} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Validation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertDashboard;
