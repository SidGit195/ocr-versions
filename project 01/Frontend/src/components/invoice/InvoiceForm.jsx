import { useState } from 'react';
import Button from '../ui/Button';

export default function InvoiceForm({ invoice, onSubmit, isSubmitting = false }) {
  console.log('InvoiceForm props:', { invoice, onSubmit, isSubmitting });
  
  const [formData, setFormData] = useState({
    id: invoice?.id || null, // Include the ID field
    invoice_number: invoice?.invoice_number || '',
    date: invoice?.date || '',
    vendor_name: invoice?.vendor_name || '',
    bill_to: invoice?.bill_to || '',
    subtotal: invoice?.subtotal || '',
    tax: invoice?.tax || '',
    total: invoice?.total || '',
    items: invoice?.items || []
  });

  console.log('Initial formData:', formData);
  console.log('Invoice ID in formData:', formData.id);

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: '',
    unit_price: '',
    amount: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Auto-calculate amount if quantity and unit_price are set
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(updatedItems[index].quantity) || 0;
      const unitPrice = field === 'unit_price' ? parseFloat(value) || 0 : parseFloat(updatedItems[index].unit_price) || 0;
      updatedItems[index].amount = (quantity * unitPrice).toFixed(2);
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleNewItemChange = (field, value) => {
    setNewItem(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate amount if quantity and unit_price are set
      if (field === 'quantity' || field === 'unit_price') {
        const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(prev.quantity) || 0;
        const unitPrice = field === 'unit_price' ? parseFloat(value) || 0 : parseFloat(prev.unit_price) || 0;
        updated.amount = (quantity * unitPrice).toFixed(2);
      }
      
      return updated;
    });
  };

  const addItem = () => {
    // Validate that at least description is filled
    if (!newItem.description.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem, id: prev.items.length > 0 ? Math.max(...prev.items.map(item => item.id || 0)) + 1 : 1 }]
    }));
    
    // Reset the new item form
    setNewItem({
      description: '',
      quantity: '',
      unit_price: '',
      amount: ''
    });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    try {
      const subtotal = formData.items.reduce((sum, item) => {
        const amount = parseFloat(item.amount) || 0;
        return sum + amount;
      }, 0).toFixed(2);
      const tax = (parseFloat(formData.tax) || 0).toFixed(2);
      const total = (parseFloat(subtotal) + parseFloat(tax)).toFixed(2);
      
      setFormData(prev => ({
        ...prev,
        subtotal,
        total
      }));
    } catch (error) {
      console.error('Error calculating totals:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      console.log('Form data being submitted:', formData);
      onSubmit(formData);
    } catch (error) {
      console.error('Error in form submission:', error);
      alert('An error occurred while submitting the form. Please check the console for details.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Invoice Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Review and edit the extracted invoice details
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoice_number"
                id="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Invoice Date
              </label>
              <input
                type="date"
                name="date"
                id="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="vendor_name" className="block text-sm font-medium text-gray-700">
                Vendor Name
              </label>
              <input
                type="text"
                name="vendor_name"
                id="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="bill_to" className="block text-sm font-medium text-gray-700">
                Bill To
              </label>
              <input
                type="text"
                name="bill_to"
                id="bill_to"
                value={formData.bill_to}
                onChange={handleChange}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Invoice Items
          </h3>
        </div>
        
        <div className="border-t border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-36">
                  Unit Price
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-36">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-left">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="0"
                      step="0.01"
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3 text-center"
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      min="0"
                      step="0.01"
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3 text-center"
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      min="0"
                      step="0.01"
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3 text-center"
                      readOnly
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* New item row */}
              <tr className="bg-gray-50">
                <td className="px-6 py-3 text-left">
                  <input
                    type="text"
                    value={newItem.description}
                    onChange={(e) => handleNewItemChange('description', e.target.value)}
                    placeholder="Enter description"
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => handleNewItemChange('quantity', e.target.value)}
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3 text-center"
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="number"
                    value={newItem.unit_price}
                    onChange={(e) => handleNewItemChange('unit_price', e.target.value)}
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3 text-center"
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <input
                    type="number"
                    value={newItem.amount}
                    onChange={(e) => handleNewItemChange('amount', e.target.value)}
                    placeholder="Amount"
                    min="0"
                    step="0.01"
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border border-gray-300 rounded-md py-2 px-3 text-center"
                    readOnly
                  />
                </td>
                <td className="px-6 py-3 text-center">
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Add Item
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex justify-end">
            <table className="text-right w-80">
              <tbody>
                <tr>
                  <td className="py-2 pr-4">
                    <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                  </td>
                  <td className="py-2 pl-4 text-right w-36">
                    <span className="text-sm text-gray-900 font-medium">₹{formData.subtotal || '0.00'}</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">
                    <span className="text-sm font-medium text-gray-700">Tax:</span>
                  </td>
                  <td className="py-2 pl-4 text-right w-36">
                    <div className="flex items-center justify-end">
                      <span className="mr-2">₹</span>
                      <input
                        type="number"
                        name="tax"
                        value={formData.tax}
                        onChange={handleChange}
                        onBlur={calculateTotals}
                        min="0"
                        step="0.01"
                        className="w-24 focus:ring-primary-500 focus:border-primary-500 shadow-sm sm:text-sm border border-gray-300 rounded-md text-right py-1 px-2"
                      />
                    </div>
                  </td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="py-3 pr-4">
                    <span className="text-base font-bold text-gray-900">Total:</span>
                  </td>
                  <td className="py-3 pl-4 text-right w-36">
                    <span className="text-base text-gray-900 font-bold">₹{formData.total || '0.00'}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end mt-6 space-x-4">
            <button
              type="button" 
              onClick={calculateTotals}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Calculate Totals
            </button>
            
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Save Invoice
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
