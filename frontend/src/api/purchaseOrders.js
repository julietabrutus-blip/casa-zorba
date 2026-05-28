import api from './client';

export const getPurchaseOrders = (params) => api.get('/purchase-orders', { params });
export const getPurchaseOrder = (id) => api.get(`/purchase-orders/${id}`);
export const generatePurchaseOrders = (data) => api.post('/purchase-orders/generate', data);
export const updatePOStatus = (id, estado) => api.patch(`/purchase-orders/${id}/status`, { estado });
export const updatePO = (id, data) => api.put(`/purchase-orders/${id}`, data);
export const sendWhatsapp = (id) => api.post(`/purchase-orders/${id}/send-whatsapp`);
export const sendEmail = (id) => api.post(`/purchase-orders/${id}/send-email`);
export const cancelPO = (id) => api.delete(`/purchase-orders/${id}`);
