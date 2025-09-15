import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Function to upload an invoice (file upload)
export const uploadInvoice = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/upload-invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading invoice:', error);
    throw error;
  }
};

// Function to update an existing invoice
export const updateInvoice = async (invoiceId, invoiceData) => {
  try {
    const response = await api.put(`/update-invoice/${invoiceId}`, invoiceData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// Function to get all invoices
export const getInvoices = async () => {
  try {
    const response = await api.get('/invoices');
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// Function to get paginated invoices with filters
export const getInvoicesPaginated = async (params = {}) => {
  try {
    const response = await api.get('/invoices', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching paginated invoices:', error);
    throw error;
  }
};

// Function to get a specific invoice by ID
export const getInvoiceById = async (invoiceId) => {
  try {
    const response = await api.get(`/invoice/${invoiceId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching invoice with ID ${invoiceId}:`, error);
    throw error;
  }
};

// Function to check backend health status
export const getHealthStatus = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking health status:', error);
    throw error;
  }
};

export default {
  uploadInvoice,
  updateInvoice,
  getInvoices,
  getInvoicesPaginated,
  getInvoiceById,
  getHealthStatus,
};
