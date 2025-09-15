import { useState } from 'react';
import { uploadInvoice, updateInvoice } from '../services/api';
import FileUploader from '../components/invoice/FileUploader';
import InvoiceForm from '../components/invoice/InvoiceForm';
import Alert from '../components/ui/Alert';
import ErrorBoundary from '../components/ui/ErrorBoundary';

export default function UploadInvoicePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [extractedInvoice, setExtractedInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = async (file) => {
    setIsUploading(true);
    setUploadStatus({ type: '', message: '' });
    
    try {
      const response = await uploadInvoice(file);
      console.log('Full upload response:', response);
      
      // The backend returns the invoice data directly, not in a nested structure
      const data = response;
      
      // Make sure the data has the expected format before setting it
      const formattedInvoice = {
        id: data.id,
        invoice_number: data.invoice_number || '',
        date: data.date || data.invoice_date || '', // Handle both formats
        vendor_name: data.vendor_name || '',
        bill_to: data.bill_to || data.customer_name || '',
        subtotal: data.subtotal || '',
        tax: data.tax || '0.00',
        total: data.total || data.total_amount || '',
        items: Array.isArray(data.items) ? data.items.map((item, index) => ({
          id: item.id || index + 1,
          description: item.description || item.item_description || '',
          quantity: item.quantity || '',
          unit_price: item.unit_price || '',
          amount: item.amount || item.total_amount || ''
        })) : []
      };

      console.log('Formatted invoice with ID:', formattedInvoice.id);
      
      setExtractedInvoice(formattedInvoice);
      console.log('Formatted invoice for form:', formattedInvoice);
      setUploadStatus({ type: 'success', message: 'Invoice uploaded and processed successfully!' });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Failed to upload and process invoice. Please try again.' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setUploadStatus({ type: '', message: '' });
    
    try {
      // Transform form data to match backend schema
      const backendData = {
        invoice_number: formData.invoice_number,
        invoice_date: formData.date, // Transform 'date' to 'invoice_date'
        customer_name: formData.bill_to, // Transform 'bill_to' to 'customer_name'
        vendor_name: formData.vendor_name,
        total_amount: formData.total,
        items: formData.items.map(item => ({
          id: item.id, // Include ID for existing items
          item_description: item.description, // Transform 'description' to 'item_description'
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: item.amount // Transform 'amount' to 'total_amount'
        }))
      };

      console.log('Submitting data:', backendData);
      console.log('formData.id:', formData.id);
      console.log('extractedInvoice:', extractedInvoice);
      console.log('extractedInvoice.id:', extractedInvoice?.id);
      
      // Use the ID from formData which should be preserved from the uploaded invoice
      const invoiceId = formData.id || extractedInvoice?.id;
      
      if (invoiceId) {
        const updatedInvoice = await updateInvoice(invoiceId, backendData);
        console.log('Updated invoice:', updatedInvoice);
        setUploadStatus({ type: 'success', message: 'Invoice updated successfully!' });
      } else {
        // This shouldn't normally happen as we always have an ID from the upload
        console.error('Missing invoice ID. formData:', formData, 'extractedInvoice:', extractedInvoice);
        setUploadStatus({ type: 'error', message: `Missing invoice ID. Cannot update invoice. Form ID: ${formData.id}, Extracted ID: ${extractedInvoice?.id}` });
      }
    } catch (error) {
      console.error('Save error:', error);
      setUploadStatus({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Failed to save invoice. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setExtractedInvoice(null);
    setUploadStatus({ type: '', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Upload Invoice
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload an invoice to extract its information automatically
          </p>
        </div>
        
        {extractedInvoice && (
          <div className="mt-4 md:mt-0">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Another Invoice
            </button>
          </div>
        )}
      </div>

      {uploadStatus.message && (
        <Alert type={uploadStatus.type} message={uploadStatus.message} />
      )}

      {!extractedInvoice ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <FileUploader 
            onFileSelect={handleFileSelect} 
            isLoading={isUploading} 
          />
        </div>
      ) : (
        <ErrorBoundary>
          <InvoiceForm 
            invoice={extractedInvoice} 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
