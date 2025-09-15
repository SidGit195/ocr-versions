import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInvoiceById, updateInvoice } from '../services/api';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchInvoice();
  }, [id]); // fetchInvoice is stable

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await getInvoiceById(id);
      const invoiceData = response.data || response;
      setInvoice(invoiceData);
      setEditData(invoiceData);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...invoice });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...invoice });
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addNewItem = () => {
    setEditData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_description: '',
          quantity: '',
          unit_price: '',
          total_amount: ''
        }
      ]
    }));
  };

  const removeItem = (index) => {
    setEditData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    const total = editData.items?.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total_amount || 0);
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0) || 0;
    
    return total.toFixed(2);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Calculate and update total
      const calculatedTotal = calculateTotal();
      const dataToSave = {
        ...editData,
        total_amount: calculatedTotal
      };

      const response = await updateInvoice(id, dataToSave);
      const updatedInvoice = response.data || response;
      
      setInvoice(updatedInvoice);
      setEditData(updatedInvoice);
      setIsEditing(false);
      setSuccess('Invoice updated successfully!');
      setError('');
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError('Failed to update invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-lg text-gray-500">Loading invoice details...</span>
        </div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Alert type="error" message={error} />
        <div className="mt-4">
          <Link to="/invoices" className="text-blue-600 hover:text-blue-900">
            ← Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/invoices" className="text-blue-600 hover:text-blue-900 mb-2 inline-block">
              ← Back to Invoices
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice #{invoice?.invoice_number || 'N/A'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Invoice details and items
            </p>
          </div>
          <div className="flex space-x-3">
            {!isEditing ? (
              <Button onClick={handleEdit} variant="primary">
                Edit Invoice
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={handleSave} variant="primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Invoice Details */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Invoice Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.invoice_number || ''}
                onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{invoice?.invoice_number || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
            {isEditing ? (
              <input
                type="date"
                value={editData.invoice_date || ''}
                onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{formatDate(invoice?.invoice_date)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
            {isEditing ? (
              <p className="text-gray-900 font-semibold">{formatCurrency(calculateTotal())}</p>
            ) : (
              <p className="text-gray-900 font-semibold">{formatCurrency(invoice?.total_amount)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.vendor_name || ''}
                onChange={(e) => handleInputChange('vendor_name', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{invoice?.vendor_name || 'N/A'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.customer_name || ''}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{invoice?.customer_name || 'N/A'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Items</h2>
          {isEditing && (
            <Button onClick={addNewItem} variant="secondary" size="sm">
              Add Item
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                {isEditing && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(isEditing ? editData.items : invoice?.items)?.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.item_description || ''}
                        onChange={(e) => handleItemChange(index, 'item_description', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Item description"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.item_description || 'N/A'}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{item.quantity || 'N/A'}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.unit_price || ''}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{formatCurrency(item.unit_price)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.total_amount || ''}
                        onChange={(e) => handleItemChange(index, 'total_amount', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(item.total_amount)}</div>
                    )}
                  </td>
                  {isEditing && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {(!invoice?.items || invoice.items.length === 0) && !isEditing && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="mt-6 flex justify-end">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              Total: {isEditing ? formatCurrency(calculateTotal()) : formatCurrency(invoice?.total_amount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
