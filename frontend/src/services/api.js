import axios from 'axios';

// Set the base URL to your Node.js backend
const API = axios.create({
    baseURL: 'http://localhost:3000/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to attach the JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const userApi = {
    getAllUsers: () => API.get('/company/users'),
    createUser: (userData) => API.post('/company/users', userData),
    updateUser: (userId, updateData) => API.put(`/company/users/${userId}`, updateData),
    sendPassword: (userId) => API.post(`/company/users/${userId}/reset-password`),
    // Configuration API (to be built later)
    updateApprovalRules: (userId, rules) => API.post(`/config/approval-rules/${userId}`, rules), 
};

export default API;