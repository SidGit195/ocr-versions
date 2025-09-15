
from pydantic import BaseModel
from typing import List, Optional

class ItemCreate(BaseModel):
    item_description: str
    quantity: str
    unit_price: str
    total_amount: str

class InvoiceCreate(BaseModel):
    invoice_number: str
    invoice_date: str
    customer_name: str
    vendor_name: str
    total_amount: str
    items: List[ItemCreate]

class ItemResponse(ItemCreate):
    id: int

class InvoiceResponse(InvoiceCreate):
    id: int
    items: List[ItemResponse]

class ItemUpdate(BaseModel):
    id: Optional[int] = None  # Include item ID for updates
    item_description: Optional[str] = None
    quantity: Optional[str] = None
    unit_price: Optional[str] = None
    total_amount: Optional[str] = None

class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    customer_name: Optional[str] = None
    vendor_name: Optional[str] = None
    total_amount: Optional[str] = None
    items: Optional[List[ItemUpdate]] = None
