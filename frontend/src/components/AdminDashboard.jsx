import React, { useState, useEffect } from 'react';
// FIX: Attempting to resolve by changing file extension logic
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import ApprovalRuleDialog from './ApprovalRuleDialog.jsx';

// Define all possible roles
const ROLES = ['Employee', 'Manager', 'CFO', 'Director', 'Admin'];
// Roles available for assignment (excludes 'Admin')
const DROPDOWN_ROLES = ROLES.filter(r => r !== 'Admin');

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [managers, setManagers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

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
            // Assuming userApi.getAllUsers exists and is correctly exported/imported
            const response = await userApi.getAllUsers();
            const allUsers = response.data;
            setUsers(allUsers);
            // Managers for the dropdown include all potential approvers
            setManagers(allUsers.filter(u => ['Manager', 'CFO', 'Director', 'Admin'].includes(u.role)));
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleNewUserChange = (e) => {
        setNewUserForm({ ...newUserForm, [e.target.name]: e.target.value });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await userApi.createUser(newUserForm);
            console.log(`User ${newUserForm.name} created. Check console for temporary password.`);

            // Reset form while retaining the current companyId context
            setNewUserForm(prev => ({ name: '', email: '', role: 'Employee', managerId: '', companyId: prev.companyId }));
            setIsCreating(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to create user:', (error.response?.data?.message || error.message));
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await userApi.updateUser(userId, { role: newRole });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    const handleManagerChange = async (userId, newManagerId) => {
        try {
            // Send null if manager selection is empty
            await userApi.updateUser(userId, { managerId: newManagerId || null });
            fetchUsers();
        } catch (error) {
            console.error('Failed to update manager:', error);
        }
    };

    const handleSendPassword = async (userId) => {
        try {
            const response = await userApi.sendPassword(userId);
            console.log(response.data.message);
        } catch (error) {
            console.error('Failed to send password:', error);
        }
    };

    if (!user || user.role !== 'Admin') {
        return <p style={styles.accessDenied}>Access Denied. Admins only.</p>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Admin Dashboard: User Management</h2>
                <button onClick={logout} style={styles.logoutButton}>Logout</button>
            </div>

            <button onClick={() => setIsCreating(!isCreating)} style={styles.createButton}>
                {isCreating ? 'Cancel Creation' : '➕ Create New User'}
            </button>

            {/* User Creation Form */}
            {isCreating && (
                <div style={styles.formContainer}>
                    <h3 style={styles.formTitle}>New User Details (Company ID: {user.companyId.substring(0, 8)}...)</h3>
                    {/* Simplified form layout (4 fields + 1 button) */}
                    <form onSubmit={handleCreateUser} style={styles.form}>
                        <input
                            name="name"
                            placeholder="Name"
                            value={newUserForm.name}
                            onChange={handleNewUserChange}
                            required
                            style={styles.input}
                        />
                        <input
                            name="email"
                            placeholder="Email"
                            value={newUserForm.email}
                            onChange={handleNewUserChange}
                            required
                            style={styles.input}
                        />
                        <select
                            name="role"
                            value={newUserForm.role}
                            onChange={handleNewUserChange}
                            style={styles.select}
                        >
                            {DROPDOWN_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select
                            name="managerId"
                            value={newUserForm.managerId}
                            onChange={handleNewUserChange}
                            style={styles.select}
                        >
                            <option value="">None</option>
                            {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
                        </select>
                        <button type="submit" style={styles.submitButton}>Create & Send Password</button>
                    </form>
                </div>
            )}

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>User Name</th>
                            <th style={styles.tableHeader}>Email</th>
                            <th style={styles.tableHeader}>Role</th>
                            <th style={styles.tableHeader}>Manager</th>
                            <th style={styles.tableHeader}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id} style={styles.tableRow}>
                                <td style={styles.tableCell}>{u.name}</td>
                                <td style={styles.tableCell}>{u.email}</td>
                                <td style={styles.tableCell}>
                                    {u.role === 'Admin' ? (
                                        <span style={styles.adminBadge}>Admin</span>
                                    ) : (
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={styles.tableSelect}
                                        >
                                            {DROPDOWN_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    )}
                                </td>
                                <td style={styles.tableCell}>
                                    <select
                                        value={u.managerId?._id || ''}
                                        onChange={(e) => handleManagerChange(u._id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={styles.tableSelect}
                                    >
                                        <option value="">None</option>
                                        {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
                                    </select>
                                </td>
                                <td style={styles.tableCell}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSendPassword(u._id); }}
                                        style={styles.actionButton}
                                    >
                                        Send Password
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                                        style={{ ...styles.actionButton, ...styles.rulesButton }}
                                    >
                                        Rules
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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

const styles = {
    container: {
        padding: '30px',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #2563eb'
    },
    title: {
        margin: 0,
        color: '#1e40af',
        fontSize: '28px',
        fontWeight: '600'
    },
    logoutButton: {
        padding: '10px 24px',
        backgroundColor: '#ffffff',
        color: '#2563eb',
        border: '2px solid #2563eb',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s'
    },
    createButton: {
        padding: '12px 24px',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '500',
        marginBottom: '20px',
        transition: 'all 0.2s'
    },
    formContainer: {
        backgroundColor: '#ffffff',
        border: '2px solid #bfdbfe',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)'
    },
    formTitle: {
        margin: '0 0 20px 0',
        color: '#1e40af',
        fontSize: '20px',
        fontWeight: '600'
    },
    form: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)', // Adjusted for 4 inputs + 1 button
        gap: '12px',
        alignItems: 'end'
    },
    input: {
        padding: '10px 12px',
        border: '2px solid #bfdbfe',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    select: {
        padding: '10px 12px',
        border: '2px solid #bfdbfe',
        borderRadius: '6px',
        fontSize: '14px',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        outline: 'none'
    },
    submitButton: {
        padding: '10px 20px',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    },
    tableContainer: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)',
        border: '1px solid #e5e7eb'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    tableHeaderRow: {
        backgroundColor: '#eff6ff'
    },
    tableHeader: {
        padding: '16px',
        textAlign: 'left',
        color: '#1e40af',
        fontWeight: '600',
        fontSize: '14px',
        borderBottom: '2px solid #bfdbfe'
    },
    tableRow: {
        borderBottom: '1px solid #e5e7eb',
        transition: 'background-color 0.2s'
    },
    tableCell: {
        padding: '14px 16px',
        fontSize: '14px',
        color: '#374151'
    },
    tableSelect: {
        padding: '6px 10px',
        border: '1px solid #bfdbfe',
        borderRadius: '4px',
        fontSize: '13px',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        width: '100%'
    },
    actionButton: {
        padding: '8px 16px',
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        marginRight: '8px',
        transition: 'background-color 0.2s'
    },
    rulesButton: {
        backgroundColor: '#2563eb'
    },
    adminBadge: {
        fontWeight: 'bold',
        color: '#1e40af'
    },
    accessDenied: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '18px',
        color: '#dc2626'
    }
};

export default AdminDashboard;
