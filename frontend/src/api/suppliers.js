import api from './client';

export const getSuppliers = (params) => api.get('/suppliers', { params });
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
