import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/ui/Header';
import UploadInvoicePage from './pages/UploadInvoicePage';
import InvoicesListPage from './pages/InvoicesListPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto">
          <Routes>
            <Route path="/" element={<UploadInvoicePage />} />
            <Route path="/invoices" element={<InvoicesListPage />} />
            <Route path="/invoice/:id" element={<InvoiceDetailPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
