# Invoice OCR Frontend

This is the React + Vite frontend for the Invoice OCR application. It allows users to upload invoice files, view extracted invoice data, and manage invoices in a clean, tabular UI.

## Features
- Upload PDF or image invoices and extract data using OCR
- View and edit extracted invoice information
- Tabular display and editing of invoice items
- Calculate totals and tax
- Save and update invoices
- Responsive, modern UI built with Tailwind CSS

## Tech Stack
- [React](https://react.dev/) (18+)
- [Vite](https://vitejs.dev/) (build tool)
- [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- [Axios](https://axios-http.com/) (API requests)
- [React Router](https://reactrouter.com/) (routing)

## Getting Started

### Prerequisites
- Node.js (18+ recommended)
- Backend API running (see backend README)

### Installation
1. Clone the repository
2. Navigate to the `Frontend` folder
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Configuration
- The frontend expects the backend API to be running at `http://localhost:8000` by default.
- You can change the API URL in `src/services/api.js` if needed.

## Folder Structure

```
Frontend/
├── public/                # Static assets (if any)
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── invoice/       # Invoice-related components (FileUploader, InvoiceForm, etc.)
│   │   └── ui/            # Generic UI components (Button, Header, Alert, etc.)
│   ├── pages/             # Page-level components (UploadInvoicePage, InvoicesListPage, etc.)
│   ├── services/          # API integration (api.js)
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   ├── index.css          # Global styles
│   └── reset.css          # CSS reset
├── index.html             # HTML template
├── package.json           # Project metadata and dependencies
└── README.md              # Project documentation
```

- All React code is inside the `src/` folder.
- Components are split by domain (`invoice/`) and generic UI (`ui/`).
- Pages contain the main screens/routes.
- Services handle API calls.
- Styles are managed in `index.css` and `reset.css`.

## Usage
- Upload an invoice file on the Upload Invoice page
- Review and edit extracted invoice details
- Add, edit, or remove invoice items in a tabular format
- Calculate totals and save the invoice
- View all invoices on the View Invoices page

## Customization
- UI is styled with Tailwind CSS (via CDN in `index.html`)
- You can further customize styles in `index.css` and `reset.css`

## License
MIT

---
For backend setup and API details, see the backend README.
