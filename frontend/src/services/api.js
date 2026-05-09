import axios from 'axios';

// Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    // Unauthorized - clear token and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    break;
                case 403:
                    console.error('Access forbidden:', data.message);
                    break;
                case 404:
                    console.error('Resource not found:', data.message);
                    break;
                case 500:
                    console.error('Server error:', data.message);
                    break;
                default:
                    console.error('API Error:', data.message);
            }
        } else if (error.request) {
            // Request made but no response
            console.error('Network error: No response from server');
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }

        return Promise.reject(error);
    }
);

// API Service Methods
export const authAPI = {
    register: (data) => api.post('/api/v1/auth/register', data),
    login: (data) => api.post('/api/v1/auth/login', data),
    logout: () => api.get('/api/v1/auth/logout'),
    getMe: () => api.get('/api/v1/auth/me'),
    forgotPassword: (email) => api.post('/api/v1/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/api/v1/auth/reset-password/${token}`, { password }),
    verifyEmail: (token) => api.get(`/api/v1/auth/verify-email/${token}`),
    sellerRegisterStep1: (data) => api.post('/api/v1/auth/seller/register/step1', data),
    sellerRegisterStep2: (data) => api.post('/api/v1/auth/seller/register/step2', data),
};

export const productAPI = {
    getAll: (params) => api.get('/api/v1/products', { params }),
    getById: (id) => api.get(`/api/v1/products/${id}`),
    create: (data) => api.post('/api/v1/products', data),
    update: (id, data) => api.put(`/api/v1/products/${id}`, data),
    delete: (id) => api.delete(`/api/v1/products/${id}`),
    getSellerProducts: () => api.get('/api/v1/products/seller'),
};

export const orderAPI = {
    create: (data) => api.post('/api/v1/orders', data),
    getById: (id) => api.get(`/api/v1/orders/${id}`),
    getUserOrders: () => api.get('/api/v1/orders/user'),
    getSellerOrders: (params) => api.get('/api/v1/orders/seller', { params }),
    updateStatus: (id, data) => api.put(`/api/v1/orders/${id}/status`, data),
    acceptOrder: (id) => api.put(`/api/v1/orders/${id}/accept`),
    rejectOrder: (id, reason) => api.put(`/api/v1/orders/${id}/reject`, { reason }),
    confirmDelivery: (id) => api.put(`/api/v1/orders/${id}/confirm-delivery`),
    cancelOrder: (id, reason) => api.put(`/api/v1/orders/${id}/cancel`, { reason }),
};

export const paymentAPI = {
    getAll: (params) => api.get('/api/v1/payments', { params }),
    getSellerPayments: () => api.get('/api/v1/payments/seller'),
    releasePayment: (id) => api.put(`/api/v1/payments/${id}/release`),
    requestWithdrawal: (data) => api.post('/api/v1/payments/withdraw', data),
    getWithdrawals: () => api.get('/api/v1/payments/withdrawals'),
    getAllWithdrawals: (params) => api.get('/api/v1/payments/withdrawals/all', { params }),
    approveWithdrawal: (id, notes) => api.put(`/api/v1/payments/withdrawals/${id}/approve`, { adminNotes: notes }),
    rejectWithdrawal: (id, reason) => api.put(`/api/v1/payments/withdrawals/${id}/reject`, { rejectionReason: reason }),
};

export const adminAPI = {
    getStats: () => api.get('/api/v1/admin/stats'),
    getUsers: (params) => api.get('/api/v1/admin/users', { params }),
    blockUser: (id) => api.put(`/api/v1/admin/users/${id}/block`),
    getPendingSellers: () => api.get('/api/v1/admin/sellers/pending'),
    getSellerVerification: (id) => api.get(`/api/v1/admin/sellers/${id}/verification`),
    approveSeller: (id, notes) => api.post(`/api/v1/admin/sellers/${id}/approve`, { adminNotes: notes }),
    rejectSeller: (id, reason) => api.post(`/api/v1/admin/sellers/${id}/reject`, { rejectionReason: reason }),
    getPendingProducts: () => api.get('/api/v1/admin/products/pending'),
    approveProduct: (id, notes) => api.put(`/api/v1/admin/products/${id}/approve`, { adminNotes: notes }),
    rejectProduct: (id, reason) => api.put(`/api/v1/admin/products/${id}/reject`, { rejectionReason: reason }),
    getFlaggedReviews: () => api.get('/api/v1/admin/reviews/flagged'),
    hideReview: (id) => api.put(`/api/v1/admin/reviews/${id}/hide`),
    deleteReview: (id) => api.delete(`/api/v1/admin/reviews/${id}`),
};

export const reviewAPI = {
    getProductReviews: (productId) => api.get(`/api/v1/reviews/product/${productId}`),
    create: (data) => api.post('/api/v1/reviews', data),
    update: (id, data) => api.put(`/api/v1/reviews/${id}`, data),
    delete: (id) => api.delete(`/api/v1/reviews/${id}`),
};

export const categoryAPI = {
    getAll: () => api.get('/api/v1/categories'),
    getById: (id) => api.get(`/api/v1/categories/${id}`),
    create: (data) => api.post('/api/v1/categories', data),
    update: (id, data) => api.put(`/api/v1/categories/${id}`, data),
    delete: (id) => api.delete(`/api/v1/categories/${id}`),
};

export const settingsAPI = {
    get: () => api.get('/api/v1/settings'),
    update: (data) => api.put('/api/v1/settings', data),
};

export default api;
