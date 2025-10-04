import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx'; // Ensure you use .jsx here

const Signup = () => {
    // State to manage all required user and company data
    const [formData, setFormData] = useState({
        name: '', 
        email: '', 
        password: '', 
        // Note: The role is implicitly 'Admin' for this endpoint, 
        // but we collect the required data for the backend payload.
        
        // Company details
        companyName: '', 
        companyCountry: '', 
        companyCurrency: ''
    });
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Get the signup function from the AuthContext
    const { signup } = useAuth();
    const navigate = useNavigate();

    // Handler to update form state for all fields
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simple client-side validation check
        const { name, email, password, companyName, companyCountry, companyCurrency } = formData;
        if (!name || !email || !password || !companyName || !companyCountry || !companyCurrency) {
             setError('All fields are required to create a new company and admin account.');
             setLoading(false);
             return;
        }

        try {
            // Call the signup function from AuthContext, which posts to /api/auth/signup
            await signup(formData); 
            navigate('/dashboard'); // Navigate to main dashboard on success
        } catch (err) {
            // Display error message from backend
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>New Company & Admin Setup</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* --- Admin Details --- */}
                <h3 style={{ marginBottom: '5px', fontSize: '1.1em' }}>Admin Details</h3>
                <input type="text" name="name" placeholder="Admin Full Name" value={formData.name} onChange={handleChange} required />
                <input type="email" name="email" placeholder="Admin Email" value={formData.email} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                
                <hr style={{ margin: '15px 0', borderColor: '#eee'}} />
                
                {/* --- Company Details --- */}
                <h3 style={{ marginBottom: '5px', fontSize: '1.1em' }}>Company Details</h3>
                <input type="text" name="companyName" placeholder="Company Name" value={formData.companyName} onChange={handleChange} required />
                <input type="text" name="companyCountry" placeholder="Base Country (e.g., USA)" value={formData.companyCountry} onChange={handleChange} required />
                <input type="text" name="companyCurrency" placeholder="Base Currency (e.g., USD)" value={formData.companyCurrency} onChange={handleChange} required />
                
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', marginTop: '20px', backgroundColor: loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Creating Company...' : 'Create Company & Admin'}
                </button>
            </form>
            <p style={{marginTop: '15px', textAlign: 'center'}}>
                Already have an account? <a href="/login" style={{ color: '#007bff' }}>Login</a>
            </p>
        </div>
    );
};

export default Signup;