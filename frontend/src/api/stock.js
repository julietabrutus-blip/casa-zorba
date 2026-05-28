import api from './client';
export const getStock = () => api.get('/stock');
export const getMovements = (params) => api.get('/stock/movements', { params });
