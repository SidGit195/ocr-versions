
from app.models.invoice import Invoice, Item
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, or_, and_
from app.core.logger import logger
from datetime import datetime

class InvoiceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_invoice(self, invoice_data: dict):
        items_data = invoice_data.pop("items", [])
        invoice = Invoice(**invoice_data)
        self.db.add(invoice)
        await self.db.flush()  # Get invoice.id before commit
        for item in items_data:
            item_obj = Item(**item, invoice_id=invoice.id)
            self.db.add(item_obj)
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice

    async def get_invoice_by_id(self, invoice_id: int):
        result = await self.db.execute(
            select(Invoice).options(selectinload(Invoice.items)).where(Invoice.id == invoice_id)
        )
        return result.scalar_one_or_none()

    async def get_invoice_by_number(self, invoice_number: str):
        result = await self.db.execute(
            select(Invoice).options(selectinload(Invoice.items)).where(Invoice.invoice_number == invoice_number)
        )
        return result.scalar_one_or_none()

    async def update_invoice(self, invoice_id: int, update_data: dict):
        # Get existing invoice
        invoice = await self.get_invoice_by_id(invoice_id)
        if not invoice:
            return None
        
        # Update invoice fields (excluding items)
        items_data = update_data.pop("items", None)
        for field, value in update_data.items():
            if hasattr(invoice, field) and value is not None:
                setattr(invoice, field, value)
        
        # Update items if provided
        if items_data is not None:
            # Update existing items or add new ones, preserve all others
            logger.info(f"Updating items for invoice {invoice_id}: {items_data}")
            for item_data in items_data:
                item_copy = item_data.copy()
                item_id = item_copy.pop('id', None)
                if item_id:
                    # Update existing item
                    existing_item = next((itm for itm in invoice.items if itm.id == item_id), None)
                    if existing_item:
                        for field, value in item_copy.items():
                            if hasattr(existing_item, field) and value is not None:
                                setattr(existing_item, field, value)
                        logger.info(f"Updated item with ID {item_id}")
                    else:
                        # Item ID provided but not found, skip
                        logger.warning(f"Item with ID {item_id} not found, skipping update")
                else:
                    # No ID provided, create new item
                    new_item = Item(**item_copy, invoice_id=invoice.id)
                    self.db.add(new_item)
        
        await self.db.commit()
        await self.db.refresh(invoice)
        return invoice

    async def get_all_invoices(self):
        logger.info("Fetching all invoices from database")
        result = await self.db.execute(
            select(Invoice).options(selectinload(Invoice.items)).order_by(Invoice.id.desc())
        )
        invoices = result.scalars().all()
        logger.info(f"Found {len(invoices)} invoices in database")
        return invoices

    async def get_all_invoices_paginated(self, page: int = 1, limit: int = 10, sort_by: str = "id", sort_order: str = "desc", search: str = None, date_from: str = None, date_to: str = None):
        logger.info(f"Fetching paginated invoices: page={page}, limit={limit}")
        
        # Build base query
        query = select(Invoice).options(selectinload(Invoice.items))
        
        # Apply filters
        filters = []
        
        # Search filter (searches in invoice_number, vendor_name, customer_name)
        if search:
            search_term = f"%{search}%"
            filters.append(
                or_(
                    Invoice.invoice_number.ilike(search_term),
                    Invoice.vendor_name.ilike(search_term),
                    Invoice.customer_name.ilike(search_term)
                )
            )
        
        # Date range filter - since invoice_date is stored as string in YYYY-MM-DD format
        if date_from:
            try:
                # Validate the date format
                datetime.strptime(date_from, "%Y-%m-%d")
                # Use string comparison since dates are stored as strings in YYYY-MM-DD format
                filters.append(Invoice.invoice_date >= date_from)
                logger.info(f"Applied date_from filter: {date_from}")
            except ValueError:
                logger.warning(f"Invalid date_from format: {date_from}")
        
        if date_to:
            try:
                # Validate the date format
                datetime.strptime(date_to, "%Y-%m-%d")
                # Use string comparison since dates are stored as strings in YYYY-MM-DD format
                filters.append(Invoice.invoice_date <= date_to)
                logger.info(f"Applied date_to filter: {date_to}")
            except ValueError:
                logger.warning(f"Invalid date_to format: {date_to}")
        
        # Apply all filters
        if filters:
            query = query.where(and_(*filters))
        
        # Apply sorting
        sort_column = getattr(Invoice, sort_by, Invoice.id)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Get total count for pagination
        count_query = select(func.count(Invoice.id))
        if filters:
            count_query = count_query.where(and_(*filters))
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        # Execute query
        result = await self.db.execute(query)
        invoices = result.scalars().all()
        
        logger.info(f"Found {len(invoices)} invoices on page {page}, total: {total}")
        
        return {
            'invoices': invoices,
            'total': total
        }
