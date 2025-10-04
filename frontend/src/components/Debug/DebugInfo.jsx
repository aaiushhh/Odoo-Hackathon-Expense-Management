import React from 'react';
import { useAuth } from '../../context/AuthContext';

const DebugInfo = () => {
    const { user, isAuthenticated, token } = useAuth();
    
    return (
        <div style={{ 
            position: 'fixed', 
            top: '10px', 
            right: '10px', 
            background: 'white', 
            border: '1px solid #ccc', 
            padding: '10px', 
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000
        }}>
            <h4>Debug Info:</h4>
            <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>User: {user ? JSON.stringify(user, null, 2) : 'None'}</p>
            <p>Token: {token ? 'Present' : 'None'}</p>
        </div>
    );
};

export default DebugInfo;
