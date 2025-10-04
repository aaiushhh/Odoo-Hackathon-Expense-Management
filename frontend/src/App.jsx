import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/Auth/Login.jsx';
import Signup from './components/Auth/Signup.jsx';
import EmployeePage from './components/Employee/EmployeePage.jsx';
import ManagerPage from './components/Manager/ManagerPage.jsx';
import AdminDashboard from './components/Admin/AdminDashboard.jsx';
// --- Role-Specific Placeholder Pages ---
// const AdminDashboard = () => <h1>Admin Dashboard (Manage Users & Config)</h1>;
const ManagerDashboard = () => <h1>Manager Dashboard (Pending Approvals)</h1>;

// --- Helper Component for Protected Routes ---
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Simple role-based redirection to the appropriate dashboard
    if (user?.role?.toLowerCase() === 'admin') {
        return <AdminDashboard />;
    }
    if (user?.role?.toLowerCase() === 'manager') {
        return <ManagerPage />;
    }
    if (user?.role?.toLowerCase() === 'employee') {
        return <EmployeePage />;
    }
    
    // Default fallback
    return <EmployeePage />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        {/* Protected Route dynamically directs to the correct dashboard */}
                        <Route path="/dashboard" element={<ProtectedRoute />} />
                        {/* Direct routes for each role */}
                        <Route path="/employee" element={<EmployeePage />} />
                        <Route path="/manager" element={<ProtectedRoute />} />
                        <Route path="/admin" element={<ProtectedRoute />} />
                        {/* You'll add specific routes for expense submission, approval screens later */}
                        <Route path="*" element={<h1>404 Not Found</h1>} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;