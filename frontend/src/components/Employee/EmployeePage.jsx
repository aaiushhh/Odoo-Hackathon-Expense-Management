import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import "./EmployeePage.css";

const EmployeePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Expense-related states
    const [expenses, setExpenses] = useState([]);
    const [expensesLoading, setExpensesLoading] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        amount: '',
        currency: 'USD',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        receiptUrl: ''
    });

    // Fetch user profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    // Fetch expenses when expenses tab is active
    useEffect(() => {
        if (activeTab === 'expenses') {
            fetchExpenses();
        }
    }, [activeTab]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await API.get('/users/profile');
            if (response.data.success) {
                setProfile(response.data.user);
                setEditData(response.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchExpenses = async () => {
        try {
            setExpensesLoading(true);
            const response = await API.get('/expenses/mine');
            if (response.data.success) {
                setExpenses(response.data.expenses);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch expenses');
        } finally {
            setExpensesLoading(false);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setEditData(profile);
        setError('');
        setSuccess('');
    };

    const handleInputChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');
            const response = await API.put('/users/profile', {
                name: editData.name,
                email: editData.email,
            });
            
            if (response.data.success) {
                setProfile(response.data.user);
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                
                // Update localStorage user data
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleExpenseInputChange = (e) => {
        setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
    };

    const handleOcrUrl = async () => {
        if (!expenseForm.receiptUrl) {
            setError('Please enter a receipt URL');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await API.post('/utils/ocr', {
                imageUrl: expenseForm.receiptUrl
            });

            if (response.data.success) {
                const parsed = response.data.parsed;
                
                // Auto-fill form with OCR results
                setExpenseForm({
                    ...expenseForm,
                    amount: parsed.amount || '',
                    currency: parsed.currency || 'USD',
                    description: parsed.description || '',
                    date: parsed.date || new Date().toISOString().split('T')[0],
                });
                
                setSuccess('Receipt processed successfully!');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'OCR processing failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitExpense = async (e) => {
        e.preventDefault();
        
        if (!expenseForm.amount || !expenseForm.category) {
            setError('Amount and category are required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await API.post('/expenses', expenseForm);
            
            if (response.data.success) {
                setSuccess('Expense submitted successfully!');
                setExpenseForm({
                    amount: '',
                    currency: 'USD',
                    category: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    receiptUrl: ''
                });
                
                // Refresh expenses if we're on that tab
                if (activeTab === 'expenses') {
                    fetchExpenses();
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit expense');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#ffc107';
            case 'APPROVED': return '#28a745';
            case 'REJECTED': return '#dc3545';
            case 'UNDER_REVIEW': return '#17a2b8';
            default: return '#6c757d';
        }
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    if (loading && !profile) {
        return (
            <div className="employee-container">
                <p className="loading-text">Loading...</p>
            </div>
        );
    }

    return (
        <div className="employee-container">
            {/* Header */}
            <div className="employee-header">
                <div>
                    <h1 className="employee-title">Employee Dashboard</h1>
                    <p className="employee-subtitle">Welcome, {user?.name || 'Employee'}!</p>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="employee-tabs">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`employee-tab ${activeTab === 'profile' ? 'active' : ''}`}
                >
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`employee-tab ${activeTab === 'expenses' ? 'active' : ''}`}
                >
                    My Expenses
                </button>
                <button
                    onClick={() => setActiveTab('submit')}
                    className={`employee-tab ${activeTab === 'submit' ? 'active' : ''}`}
                >
                    Submit Expense
                </button>
            </div>

            {/* Content Area */}
            <div className="employee-content">
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

                {/* Profile Tab */}
                {activeTab === 'profile' && profile && (
                    <div className="employee-card">
                        <div className="card-header">
                            <h2 className="card-title">My Profile</h2>
                            <button
                                onClick={handleEditToggle}
                                className="edit-button"
                            >
                                {isEditing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {!isEditing ? (
                            <div className="profile-info">
                                <div className="info-row">
                                    <span className="info-label">Name:</span>
                                    <span className="info-value">{profile.name}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{profile.email}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Role:</span>
                                    <span className="info-value">{profile.role}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Employee ID:</span>
                                    <span className="info-value">{profile._id}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Member Since:</span>
                                    <span className="info-value">
                                        {new Date(profile.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateProfile} className="employee-form">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editData.name || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={editData.email || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="submit-button"
                                >
                                    {loading ? 'Updating...' : 'Update Profile'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* Expenses Tab */}
                {activeTab === 'expenses' && (
                    <div className="employee-card">
                        <div className="card-header">
                            <h2 className="card-title">My Expenses</h2>
                            <button
                                onClick={fetchExpenses}
                                className="refresh-button"
                                disabled={expensesLoading}
                            >
                                {expensesLoading ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>

                        {expensesLoading ? (
                            <p className="loading-text">Loading expenses...</p>
                        ) : expenses.length === 0 ? (
                            <p className="placeholder-text">No expenses found. Submit your first expense!</p>
                        ) : (
                            <div className="expenses-list">
                                {expenses.map((expense) => (
                                    <div key={expense.expenseId} className="expense-item">
                                        <div className="expense-header">
                                            <div className="expense-amount">
                                                {formatCurrency(expense.amount, expense.currency)}
                                            </div>
                                            <div 
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(expense.status) }}
                                            >
                                                {expense.status}
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
                                                {new Date(expense.date).toLocaleDateString()}
                                            </div>
                                            {expense.convertedAmount && expense.convertedAmount !== expense.amount && (
                                                <div className="converted-amount">
                                                    Converted: {formatCurrency(expense.convertedAmount, 'USD')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Expense Tab */}
                {activeTab === 'submit' && (
                    <div className="employee-card">
                        <h2 className="card-title">Submit New Expense</h2>
                        
                        {/* OCR Section - Only URL option */}
                        <div className="ocr-section">
                            <h3 className="section-title">📷 Receipt OCR (Optional)</h3>
                            <p className="section-description">
                                Provide a receipt URL to automatically extract expense details.
                            </p>
                            
                            <div className="ocr-options">
                                <div className="ocr-option">
                                    <h4>Receipt URL</h4>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/receipt.jpg"
                                        value={expenseForm.receiptUrl}
                                        onChange={(e) => setExpenseForm({...expenseForm, receiptUrl: e.target.value})}
                                        className="form-input"
                                    />
                                    <button
                                        onClick={handleOcrUrl}
                                        disabled={!expenseForm.receiptUrl || loading}
                                        className="ocr-button"
                                    >
                                        {loading ? 'Processing...' : 'Process URL'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expense Form */}
                        <form onSubmit={handleSubmitExpense} className="employee-form">
                            <h3 className="section-title">Expense Details</h3>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Amount *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={expenseForm.amount}
                                        onChange={handleExpenseInputChange}
                                        className="form-input"
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Currency</label>
                                    <select
                                        name="currency"
                                        value={expenseForm.currency}
                                        onChange={handleExpenseInputChange}
                                        className="form-select"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="JPY">JPY</option>
                                        <option value="INR">INR</option>
                                        <option value="CAD">CAD</option>
                                        <option value="AUD">AUD</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select
                                    name="category"
                                    value={expenseForm.category}
                                    onChange={handleExpenseInputChange}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Travel">Travel</option>
                                    <option value="Meals">Meals</option>
                                    <option value="Transportation">Transportation</option>
                                    <option value="Accommodation">Accommodation</option>
                                    <option value="Office Supplies">Office Supplies</option>
                                    <option value="Entertainment">Entertainment</option>
                                    <option value="Training">Training</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    value={expenseForm.description}
                                    onChange={handleExpenseInputChange}
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Brief description of the expense..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={expenseForm.date}
                                    onChange={handleExpenseInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-button"
                            >
                                {loading ? 'Submitting...' : 'Submit Expense'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeePage;