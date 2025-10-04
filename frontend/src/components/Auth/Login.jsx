import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard'); // Navigate to main dashboard on success
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Login to Expense System</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: '10px' }}/>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ marginBottom: '10px' }}/>
                
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', marginTop: '10px' }}>
                    {loading ? 'Logging In...' : 'Login'}
                </button>
            </form>
             <p style={{marginTop: '10px'}}>New Company? <a href="/signup">Sign Up</a></p>
        </div>
    );
};

export default Login;