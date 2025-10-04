import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import "./ManagerPage.css";

const ManagerPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingExpenses, setPendingExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [approvalComment, setApprovalComment] = useState('');

    // Fetch pending expenses on mount and when tab changes
    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPendingExpenses();
        }
    }, [activeTab]);

    const fetchPendingExpenses = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await API.get('/approvals/pending/all');
            if (response.data.success) {
                setPendingExpenses(response.data.expenses);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch pending expenses');
        } finally {
            setLoading(false);
        }
    };

    const handleApprovalDecision = async (expenseId, decision) => {
        if (!decision) {
            setError('Please select approve or reject');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await API.post(`/approvals/${expenseId}/decision`, {
                decision: decision,
                comment: approvalComment
            });

            if (response.data.success) {
                setSuccess(`Expense ${decision.toLowerCase()} successfully!`);
                setSelectedExpense(null);
                setApprovalComment('');
                fetchPendingExpenses(); // Refresh the list
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process approval decision');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#ffc107';
            case 'IN_PROGRESS': return '#17a2b8';
            case 'APPROVED': return '#28a745';
            case 'REJECTED': return '#dc3545';
            default: return '#6c757d';
        }
    };

    return (
        <div className="manager-container">
            {/* Header */}
            <div className="manager-header">
                <div>
                    <h1 className="manager-title">Manager Dashboard</h1>
                    <p className="manager-subtitle">Welcome, {user?.name || 'Manager'}!</p>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="manager-tabs">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`manager-tab ${activeTab === 'pending' ? 'active' : ''}`}
                >
                    Pending Approvals ({pendingExpenses.length})
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`manager-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                >
                    Analytics
                </button>
            </div>

            {/* Content Area */}
            <div className="manager-content">
                {error && (
                    <div className="error-alert">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="success-alert">
                        {success}
                    </div>
                )}

                {/* Pending Approvals Tab */}
                {activeTab === 'pending' && (
                    <div className="manager-card">
                        <div className="card-header">
                            <h2 className="card-title">Pending Expense Approvals</h2>
                            <button
                                onClick={fetchPendingExpenses}
                                className="refresh-button"
                                disabled={loading}
                            >
                                {loading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>

                        {loading ? (
                            <p className="loading-text">Loading pending expenses...</p>
                        ) : pendingExpenses.length === 0 ? (
                            <p className="placeholder-text">No pending expenses to approve!</p>
                        ) : (
                            <div className="expenses-list">
                                {pendingExpenses.map((expense) => (
                                    <div key={expense.expenseId} className="expense-item">
                                        <div className="expense-header">
                                            <div className="expense-amount">
                                                {formatCurrency(expense.amount, expense.currency)}
                                            </div>
                                            <div 
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(expense.approvalFlow.status) }}
                                            >
                                                {expense.approvalFlow.status}
                                            </div>
                                        </div>
                                        
                                        <div className="expense-details">
                                            <div className="expense-category">
                                                <strong>{expense.category}</strong>
                                            </div>
                                            <div className="expense-description">
                                                {expense.description}
                                            </div>
                                            <div className="expense-date">
                                                Submitted: {formatDate(expense.submittedAt)}
                                            </div>
                                            <div className="expense-date">
                                                Expense Date: {new Date(expense.date).toLocaleDateString()}
                                            </div>
                                            
                                            {expense.convertedAmount && expense.convertedAmount !== expense.amount && (
                                                <div className="converted-amount">
                                                    Converted: {formatCurrency(expense.convertedAmount, 'USD')}
                                                </div>
                                            )}

                                            {/* Approval Progress */}
                                            <div className="approval-progress">
                                                <div className="progress-label">
                                                    Approval Progress: {expense.approvalFlow.currentStep} of {expense.totalSteps}
                                                </div>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ 
                                                            width: `${(expense.approvalFlow.currentStep / expense.totalSteps) * 100}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Previous Approvals */}
                                            {expense.approvalFlow.approvals.length > 0 && (
                                                <div className="approval-history">
                                                    <h4>Approval History:</h4>
                                                    {expense.approvalFlow.approvals.map((approval, index) => (
                                                        <div key={index} className="approval-item">
                                                            <span className="approver-name">{approval.approverName}</span>
                                                            <span className={`approval-decision ${approval.decision.toLowerCase()}`}>
                                                                {approval.decision}
                                                            </span>
                                                            {approval.comment && (
                                                                <div className="approval-comment">"{approval.comment}"</div>
                                                            )}
                                                            <div className="approval-date">
                                                                {formatDate(approval.timestamp)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="expense-actions">
                                            <button
                                                onClick={() => setSelectedExpense(expense)}
                                                className="view-details-button"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleApprovalDecision(expense.expenseId, 'APPROVED')}
                                                disabled={loading}
                                                className="approve-button"
                                            >
                                                ✓ Approve
                                            </button>
                                            <button
                                                onClick={() => handleApprovalDecision(expense.expenseId, 'REJECTED')}
                                                disabled={loading}
                                                className="reject-button"
                                            >
                                                ✗ Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="manager-card">
                        <h2 className="card-title">Analytics Dashboard</h2>
                        <p className="placeholder-text">Analytics features coming soon...</p>
                    </div>
                )}
            </div>

            {/* Approval Modal */}
            {selectedExpense && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Expense Details</h3>
                            <button 
                                onClick={() => setSelectedExpense(null)}
                                className="modal-close"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="expense-detail-row">
                                <span className="detail-label">Amount:</span>
                                <span className="detail-value">
                                    {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                                </span>
                            </div>
                            <div className="expense-detail-row">
                                <span className="detail-label">Category:</span>
                                <span className="detail-value">{selectedExpense.category}</span>
                            </div>
                            <div className="expense-detail-row">
                                <span className="detail-label">Description:</span>
                                <span className="detail-value">{selectedExpense.description}</span>
                            </div>
                            <div className="expense-detail-row">
                                <span className="detail-label">Date:</span>
                                <span className="detail-value">{new Date(selectedExpense.date).toLocaleDateString()}</span>
                            </div>
                            <div className="expense-detail-row">
                                <span className="detail-label">Submitted:</span>
                                <span className="detail-value">{formatDate(selectedExpense.submittedAt)}</span>
                            </div>
                            
                            {selectedExpense.receiptUrl && (
                                <div className="expense-detail-row">
                                    <span className="detail-label">Receipt:</span>
                                    <a 
                                        href={selectedExpense.receiptUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="receipt-link"
                                    >
                                        View Receipt
                                    </a>
                                </div>
                            )}

                            <div className="approval-comment-section">
                                <label className="form-label">Add Comment (Optional):</label>
                                <textarea
                                    value={approvalComment}
                                    onChange={(e) => setApprovalComment(e.target.value)}
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Add your approval comment..."
                                />
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button
                                onClick={() => handleApprovalDecision(selectedExpense.expenseId, 'APPROVED')}
                                disabled={loading}
                                className="approve-button"
                            >
                                ✓ Approve
                            </button>
                            <button
                                onClick={() => handleApprovalDecision(selectedExpense.expenseId, 'REJECTED')}
                                disabled={loading}
                                className="reject-button"
                            >
                                ✗ Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerPage;
