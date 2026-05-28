import api from './client';

export const getProducts = (params) => api.get('/products', { params });
export const getPendingProducts = () => api.get('/products/pending');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
