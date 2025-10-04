import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:3000/api', 
    headers: {
        'Content-Type': 'application/json',
    },
});

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
    getAllUsers: () => API.get('/users/employees'),
    createUser: (userData) => API.post('/users/employees', userData),
    updateUser: (userId, updateData) => API.put(`/users/employees/${userId}`, updateData),
    sendPassword: (userId) => API.post(`/users/employees/${userId}/reset-password`),
    updateApprovalRules: (userId, rules) => API.post(`/config/approval-rules/${userId}`, rules), 
};

export default API;