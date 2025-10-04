import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api'; // Import the service

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simple logic to set user details from localStorage or verify token (optional complexity)
        const storedUser = localStorage.getItem('user');
        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('user');
                setUser(null);
            }
        }
        setIsLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await API.post('/auth/login', { email, password });
            const { token: newToken, user: userData } = response.data;
            
            // Store and update state
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(newToken);
            setUser(userData);

            return true;
        } catch (error) {
            console.error('Login failed:', error.response?.data?.message || error.message);
            throw error; // Re-throw to be handled by the form component
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        // Navigate away might be needed here
    };

    const signup = async (formData) => {
         try {
            const response = await API.post('/auth/signup', formData);
            const { token: newToken, user: userData } = response.data;

            // Store and update state after successful signup
            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(newToken);
            setUser(userData);
            
            return true;
        } catch (error) {
            console.error('Signup failed:', error.response?.data?.message || error.message);
            throw error;
        }
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, signup, isAuthenticated: !!user }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};