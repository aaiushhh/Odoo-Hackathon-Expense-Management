import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { userApi } from '../../services/api';
import ApprovalRuleDialog from './ApprovalDialogue.jsx';
import './AdminDashboard.css';

// Define all possible roles
const ROLES = ['Employee', 'Manager', 'CFO', 'Director', 'Admin'];
// Roles available for assignment (excludes 'Admin')
const DROPDOWN_ROLES = ROLES.filter(r => r !== 'Admin');

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [managers, setManagers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Initialize newUserForm with the Admin's companyId 
    const [newUserForm, setNewUserForm] = useState({
        name: '',
        email: '',
        role: 'Employee',
        managerId: '',
        companyId: user?.companyId || ''
    });
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        // Ensure companyId is set immediately if user object loads late
        if (user && user.role === 'Admin') {
            setNewUserForm(prev => ({
                ...prev,
                companyId: user.companyId
            }));
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            setError('');
            const response = await userApi.getAllUsers();
            const allUsers = response.data.employees || response.data;
            setUsers(allUsers);
            // Managers for the dropdown include all potential approvers
            setManagers(allUsers.filter(u => ['Manager', 'CFO', 'Director', 'Admin'].includes(u.role)));
        } catch (error) {
            console.error("Error fetching users:", error);
            setError(error.response?.data?.message || 'Failed to fetch users');
        }
    };

    const handleNewUserChange = (e) => {
        setNewUserForm({ ...newUserForm, [e.target.name]: e.target.value });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setSuccess('');
            await userApi.createUser(newUserForm);
            setSuccess(`User ${newUserForm.name} created successfully!`);

            // Reset form while retaining the current companyId context
            setNewUserForm(prev => ({ 
                name: '', 
                email: '', 
                role: 'Employee', 
                managerId: '', 
                password: 'defaultpassword',
                companyId: prev.companyId 
            }));
            setIsCreating(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to create user:', (error.response?.data?.message || error.message));
            setError(error.response?.data?.message || 'Failed to create user');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setError('');
            setSuccess('');
            await userApi.updateUser(userId, { role: newRole });
            setSuccess('Role updated successfully!');
            fetchUsers();
        } catch (error) {
            console.error('Failed to update role:', error);
            setError(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleManagerChange = async (userId, newManagerId) => {
        try {
            setError('');
            setSuccess('');
            // Send null if manager selection is empty
            await userApi.updateUser(userId, { managerId: newManagerId || null });
            setSuccess('Manager updated successfully!');
            fetchUsers();
        } catch (error) {
            console.error('Failed to update manager:', error);
            setError(error.response?.data?.message || 'Failed to update manager');
        }
    };

    const handleSendPassword = async (userId) => {
        try {
            setError('');
            setSuccess('');
            const response = await userApi.sendPassword(userId);
            setSuccess(response.data.message || 'Password reset email sent!');
        } catch (error) {
            console.error('Failed to send password:', error);
            setError(error.response?.data?.message || 'Failed to send password');
        }
    };

    if (!user || user.role !== 'Admin') {
        return <p className="admin-access-denied">Access Denied. Admins only.</p>;
    }

    return (
        <div className="admin-container">
            {/* Header */}
            <div className="admin-header">
                <h2 className="admin-title">Admin Dashboard: User Management</h2>
                <button onClick={logout} className="admin-logout-button">
                    Logout
                </button>
            </div>

            {/* Alert Messages */}
            {error && (
                <div className="error-alert" style={{ marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}
            {success && (
                <div className="success-alert" style={{ marginBottom: '1.5rem' }}>
                    {success}
                </div>
            )}

            {/* Create User Button */}
            <button 
                onClick={() => setIsCreating(!isCreating)} 
                className="admin-create-button"
            >
                {isCreating ? '✕ Cancel Creation' : '➕ Create New User'}
            </button>

            {/* User Creation Form */}
            {isCreating && (
                <div className="admin-form-container">
                    <h3 className="admin-form-title">
                        New User Details (Company ID: {user.companyId.substring(0, 8)}...)
                    </h3>
                    <form onSubmit={handleCreateUser} className="admin-form">
                        <input
                            name="name"
                            placeholder="Full Name"
                            value={newUserForm.name}
                            onChange={handleNewUserChange}
                            required
                            className="admin-input"
                        />
                        <input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            value={newUserForm.email}
                            onChange={handleNewUserChange}
                            required
                            className="admin-input"
                        />
                        <select
                            name="role"
                            value={newUserForm.role}
                            onChange={handleNewUserChange}
                            className="admin-select"
                        >
                            {DROPDOWN_ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <select
                            name="managerId"
                            value={newUserForm.managerId}
                            onChange={handleNewUserChange}
                            className="admin-select"
                        >
                            <option value="">No Manager</option>
                            {managers.map(m => (
                                <option key={m._id} value={m._id}>
                                    {m.name} ({m.role})
                                </option>
                            ))}
                        </select>
                        <button type="submit" className="admin-submit-button">
                            Create & Send Password
                        </button>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr className="admin-table-header-row">
                            <th className="admin-table-header">User Name</th>
                            <th className="admin-table-header">Email</th>
                            <th className="admin-table-header">Role</th>
                            <th className="admin-table-header">Manager</th>
                            <th className="admin-table-header">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id} className="admin-table-row">
                                <td className="admin-table-cell">{u.name}</td>
                                <td className="admin-table-cell">{u.email}</td>
                                <td className="admin-table-cell">
                                    {u.role === 'Admin' ? (
                                        <span className="admin-badge">Admin</span>
                                    ) : (
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="admin-table-select"
                                        >
                                            {DROPDOWN_ROLES.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                                <td className="admin-table-cell">
                                    <select
                                        value={u.managerId?._id || ''}
                                        onChange={(e) => handleManagerChange(u._id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="admin-table-select"
                                    >
                                        <option value="">No Manager</option>
                                        {managers.map(m => (
                                            <option key={m._id} value={m._id}>
                                                {m.name} ({m.role})
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="admin-table-cell">
                                    <button
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleSendPassword(u._id); 
                                        }}
                                        className="admin-action-button"
                                    >
                                        Send Password
                                    </button>
                                    <button
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setSelectedUser(u); 
                                        }}
                                        className="admin-action-button admin-rules-button"
                                    >
                                        Rules
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Approval Rule Modal */}
            {selectedUser && (
                <ApprovalRuleDialog
                    user={selectedUser}
                    managers={managers}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;