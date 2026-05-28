import api from './client';

export const syncOrders = () => api.get('/tiendanube/sync');
export const getOrders = (params) => api.get('/tiendanube/orders', { params });
