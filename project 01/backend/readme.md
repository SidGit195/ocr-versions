# Invoice Extraction Backend

This backend service allows you to upload invoice images, extract structured data using OpenAI, and store/retrieve invoice details in a PostgreSQL database. It is built using FastAPI and follows a clean layered architecture.

## Folder Structure

```
backend/
├── readme.md
├── requirements.txt
├── rough.txt
├── app/
│   ├── main.py                # FastAPI app entrypoint
│   ├── api/                   # API routers (endpoints)
│   │   ├── invoice_router.py  # /upload-invoice endpoint
│   │   └── health_router.py   # Health check endpoint
│   ├── core/                  # Core config and logger
│   │   ├── config.py
│   │   └── logger.py
│   ├── db/                    # Database session setup
│   │   └── session.py
│   ├── models/                # SQLAlchemy models
│   │   ├── base.py
│   │   └── invoice.py         # Invoice & Item models
│   ├── repositories/          # DB access logic
│   │   └── invoice_repository.py
│   ├── schemas/               # Pydantic schemas for validation
│   │   └── invoice.py
│   ├── services/              # Business logic
│   │   └── invoice_service.py
│   └── utils/                 # Utility functions
│       ├── openai_utils.py    # OpenAI integration
│       └── recreate_db.py     # DB recreate script
├── docs/                      # Documentation
└── migrations/                # DB migrations
```

## Layered Architecture Explained

- **API (Router Layer)**
  - Handles HTTP requests (e.g., `/upload-invoice`).
  - Validates input, calls service layer, and returns response.
  - Handles duplicate invoice uploads: returns `{status: "already_parsed"}` if invoice already exists.

- **Service Layer**
  - Contains business logic for invoice processing.
  - Calls OpenAI to extract invoice data from image.
  - Normalizes and validates extracted data.
  - Handles DB save and duplicate detection.

- **Repository Layer**
  - Directly interacts with the database using SQLAlchemy models.
  - Handles creation and retrieval of invoices and items.
  - Does not contain business logic.

- **Database Layer**
  - SQLAlchemy models define tables (`Invoice`, `Item`).
  - Session management for async DB operations.

- **Schema Layer**
  - Pydantic models for request/response validation.
  - Ensures data consistency between layers.

- **Utils Layer**
  - OpenAI integration for extracting invoice data from images.
  - DB recreate script for development.

## API Behavior

- **POST /upload-invoice**
  - Upload an invoice image.
  - Extracts and saves invoice data (including items) to DB.
  - If invoice already exists, returns status `already_parsed` and the parsed data instead of error.

- **PUT /update-invoice/{invoice_id}**
  - Update existing invoice data.
  - Supports partial updates (only send changed fields).
  - Can update invoice fields and/or items.
  - Returns updated invoice data with all items.

- **GET /invoices**
  - Retrieve all invoices from the database.
  - Returns a list of invoices with their items.
  - Invoices are ordered by ID in descending order (newest first).

- **GET /invoice/{invoice_id}**
  - Retrieve a specific invoice by its ID.
  - Returns the invoice data including all its items.
  - Returns 404 error if the invoice is not found.

## Example Response

```
{
  "status": "success",
  "data": {
    "invoice_number": "2254",
    "invoice_date": "27/02/2019",
    "customer_name": "RAJ DATA PROCESSORS",
    "vendor_name": "RAJ SUPER WHOLESALE BAZAR",
    "total_amount": "3473.00",
    "items": [
      { "item_description": "...", "quantity": "...", ... },
      // ...more items
    ]
  }
}
```

If duplicate:
```
{
  "status": "already_parsed",
  "message": "Invoice already processed",
  "data": { ...same as above... }
}
```

**Update Invoice Response:**
```
{
  "status": "success",
  "message": "Invoice updated successfully",
  "data": {
    "id": 1,
    "invoice_number": "2254",
    "invoice_date": "27/02/2019",
    "customer_name": "UPDATED CUSTOMER NAME",
    "vendor_name": "RAJ SUPER WHOLESALE BAZAR",
    "total_amount": "4000.00",
    "items": [
      {
        "id": 1,
        "item_description": "Updated Item Description",
        "quantity": "15",
        "unit_price": "100.00",
        "total_amount": "1500.00"
      }
      // ...more items
    ]
  }
}
```

**Get All Invoices Response:**
```
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "invoice_number": "2254",
      "invoice_date": "27/02/2019",
      "customer_name": "RAJ DATA PROCESSORS",
      "vendor_name": "RAJ SUPER WHOLESALE BAZAR",
      "total_amount": "3473.00",
      "items": [
        {
          "id": 1,
          "item_description": "SMADIST SOYA OIL 1LTR (POUCH)",
          "quantity": "10",
          "unit_price": "78.10",
          "total_amount": "780.95"
        }
        // ...more items
      ]
    }
    // ...more invoices
  ]
}
```

**Get Invoice by ID Response:**
```
{
  "status": "success",
  "data": {
    "id": 1,
    "invoice_number": "2254",
    "invoice_date": "27/02/2019",
    "customer_name": "RAJ DATA PROCESSORS",
    "vendor_name": "RAJ SUPER WHOLESALE BAZAR",
    "total_amount": "3473.00",
    "items": [
      {
        "id": 1,
        "item_description": "SMADIST SOYA OIL 1LTR (POUCH)",
        "quantity": "10",
        "unit_price": "78.10",
        "total_amount": "780.95"
      }
      // ...more items
    ]
  }
}
```

---

**Each layer is independent and testable. This structure makes the codebase scalable, maintainable, and easy to debug.**


