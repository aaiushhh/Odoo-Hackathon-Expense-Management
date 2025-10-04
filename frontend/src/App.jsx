import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/Auth/Login.jsx';
import Signup from './components/Auth/Signup.jsx';

// --- Role-Specific Placeholder Pages ---
const AdminDashboard = () => <h1>Admin Dashboard (Manage Users & Config)</h1>;
const ManagerDashboard = () => <h1>Manager Dashboard (Pending Approvals)</h1>;
const EmployeeDashboard = () => <h1>Employee Dashboard (Submit Expenses & History)</h1>;

// --- Helper Component for Protected Routes ---
const ProtectedRoute = ({ element: Component }) => {
    const { isAuthenticated, user } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Simple role-based redirection to the appropriate dashboard
    if (user.role === 'Admin') return <AdminDashboard />;
    if (user.role === 'Manager') return <ManagerDashboard />;
    if (user.role === 'Employee') return <EmployeeDashboard />;
    
    return <Component />;
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
                        {/* You'll add specific routes for expense submission, approval screens later */}
                        <Route path="*" element={<h1>404 Not Found</h1>} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;