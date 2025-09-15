import { useState, useEffect } from 'react';
import { getInvoicesPaginated } from '../services/api';
import { Link } from 'react-router-dom';
import Alert from '../components/ui/Alert';
import DataTable from '../components/ui/DataTable';

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Standard page size - now we have 30+ invoices so pagination will show
    total: 0,
    pages: 0
  });
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    search: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setIsLoading(true);
        const queryParams = {
          page: pagination.page,
          limit: pagination.limit,
          sort_by: sortBy,
          sort_order: sortOrder,
          ...filters
        };

        // Remove empty filters
        Object.keys(queryParams).forEach(key => {
          if (!queryParams[key]) {
            delete queryParams[key];
          }
        });

        console.log('Fetching invoices with params:', queryParams);
        const response = await getInvoicesPaginated(queryParams);
        console.log('API Response:', response);
        
        setInvoices(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Failed to load invoices. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
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

  const columns = [
    {
      key: 'invoice_number',
      title: 'Invoice',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'vendor_name',
      title: 'Vendor',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'customer_name',
      title: 'Customer',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'invoice_date',
      title: 'Date',
      sortable: true,
      render: (value) => formatDate(value)
    },
    {
      key: 'total_amount',
      title: 'Total',
      sortable: true,
      render: (value) => formatCurrency(value)
    },
    {
      key: 'items',
      title: 'Items',
      sortable: false,
      render: (value) => value?.length || 0
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      render: (value, row) => (
        <Link 
          to={`/invoice/${row.id}`} 
          className="text-blue-600 hover:text-blue-900 font-medium"
        >
          View Details
        </Link>
      )
    }
  ];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all invoices processed by the system
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upload New Invoice
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      <DataTable
        data={invoices}
        columns={columns}
        totalItems={pagination.total}
        currentPage={pagination.page}
        itemsPerPage={pagination.limit}
        onPageChange={handlePageChange}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        loading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchTerm={filters.search}
        filters={filters}
      />
    </div>
  );
}
