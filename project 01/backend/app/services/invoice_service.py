from app.core.logger import logger
import json
import re
from datetime import datetime
from app.repositories.invoice_repository import InvoiceRepository
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate
from app.utils.openai_utils import extract_invoice_data
from sqlalchemy.ext.asyncio import AsyncSession

class InvoiceService:
    def __init__(self, db: AsyncSession):
        self.repo = InvoiceRepository(db)

    def normalize_date(self, date_str):
        """Convert various date formats to YYYY-MM-DD format"""
        if not date_str or date_str.strip() == "":
            return None
            
        date_str = date_str.strip()
        
        # Common date patterns
        patterns = [
            r'(\d{4})-(\d{1,2})-(\d{1,2})',  # YYYY-MM-DD or YYYY-M-D
            r'(\d{1,2})/(\d{1,2})/(\d{4})',  # MM/DD/YYYY or M/D/YYYY or DD/MM/YYYY
            r'(\d{1,2})-(\d{1,2})-(\d{4})',  # MM-DD-YYYY or DD-MM-YYYY
            r'(\d{1,2})\.(\d{1,2})\.(\d{4})', # MM.DD.YYYY or DD.MM.YYYY
            r'(\d{1,2})/(\d{1,2})/(\d{2})',   # MM/DD/YY or DD/MM/YY
        ]
        
        for pattern in patterns:
            match = re.search(pattern, date_str)
            if match:
                try:
                    if pattern == patterns[0]:  # YYYY-MM-DD
                        year, month, day = match.groups()
                        return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
                    
                    elif pattern in [patterns[1], patterns[2], patterns[3]]:  # MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
                        part1, part2, year = match.groups()
                        year = int(year)
                        
                        # Try both DD/MM and MM/DD formats
                        try:
                            # Assume DD/MM if first part > 12
                            if int(part1) > 12:
                                day, month = int(part1), int(part2)
                            else:
                                month, day = int(part1), int(part2)
                            
                            return f"{year:04d}-{month:02d}-{day:02d}"
                        except ValueError:
                            continue
                    
                    elif pattern == patterns[4]:  # MM/DD/YY
                        part1, part2, year = match.groups()
                        year = int(year)
                        if year < 50:
                            year += 2000
                        else:
                            year += 1900
                        
                        # Try both DD/MM and MM/DD formats
                        try:
                            if int(part1) > 12:
                                day, month = int(part1), int(part2)
                            else:
                                month, day = int(part1), int(part2)
                            
                            return f"{year:04d}-{month:02d}-{day:02d}"
                        except ValueError:
                            continue
                            
                except (ValueError, IndexError):
                    continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return date_str  # Return original if can't parse

    async def process_and_store_invoice(self, file):
        logger.info(f"Extracting invoice data using OpenAI for file: {file.filename}")
        extracted_json_str = extract_invoice_data(file)
        logger.info(f"Raw OpenAI response: {extracted_json_str}")
        try:
            extracted_json = json.loads(extracted_json_str)

            # Normalize keys for main invoice fields
            def normalize_invoice_keys(data):
                key_map = {
                    "Invoice Number": "invoice_number",
                    "Invoice Date": "invoice_date",
                    "Customer Name": "customer_name",
                    "Vendor Name": "vendor_name",
                    "Total Amount": "total_amount",
                    "Items": "items"
                }
                return {key_map.get(k, k): v for k, v in data.items()}

            def normalize_item_keys(item):
                item_key_map = {
                    "Item Description": "item_description",
                    "Quantity": "quantity",
                    "Unit Price": "unit_price",
                    "Total Amount": "total_amount"
                }
                return {item_key_map.get(k, k): v for k, v in item.items()}

            normalized = normalize_invoice_keys(extracted_json)
            
            # Normalize the date format
            if "invoice_date" in normalized:
                normalized["invoice_date"] = self.normalize_date(normalized["invoice_date"])
            
            items = normalized.get("items", [])
            normalized_items = [normalize_item_keys(item) for item in items]
            normalized["items"] = normalized_items

            # Create InvoiceCreate object with items included
            invoice_create = InvoiceCreate(**normalized)
            invoice_data = invoice_create.dict()
            logger.info(f"Invoice data for response: {invoice_data}")
            logger.info(f"Saving invoice to DB: {invoice_data.get('invoice_number')}")
            
            # Format items data with proper fields for the frontend
            frontend_formatted_items = []
            for item in normalized_items:
                frontend_formatted_items.append({
                    "description": item.get("item_description", ""),
                    "quantity": item.get("quantity", ""),
                    "unit_price": item.get("unit_price", ""),
                    "amount": item.get("total_amount", "")
                })
            
            # Update the invoice_data with properly formatted items
            invoice_data["items"] = frontend_formatted_items
            
            try:
                # Make a copy to avoid mutation by repository
                db_invoice_data = invoice_data.copy()
                # Need to restore original items format for database
                db_invoice_data["items"] = normalized_items
                invoice_obj = await self.repo.create_invoice(db_invoice_data)
                logger.info(f"Invoice saved with ID: {getattr(invoice_obj, 'id', None)}")
                # Return full invoice data including properly formatted items
                return invoice_obj, invoice_data, "success"
            except Exception as db_error:
                if "duplicate key value violates unique constraint" in str(db_error):
                    logger.info(f"Invoice {invoice_data.get('invoice_number')} already exists, fetching existing invoice")
                    # Rollback the transaction first to clean up the session
                    await self.repo.db.rollback()
                    # Fetch the existing invoice to get its ID and data
                    existing_invoice = await self.repo.get_invoice_by_number(invoice_data.get('invoice_number'))
                    if existing_invoice:
                        # Include the ID in the invoice_data
                        invoice_data["id"] = existing_invoice.id
                        logger.info(f"Found existing invoice with ID: {existing_invoice.id}")
                    # Return the invoice data with already_parsed status
                    return existing_invoice, invoice_data, "already_parsed"
                else:
                    # Re-raise other database errors
                    raise db_error
        except Exception as e:
            logger.error(f"Error processing invoice: {str(e)}")
            raise ValueError(f"Error processing invoice: {str(e)}")

    async def update_invoice(self, invoice_id: int, update_data: InvoiceUpdate):
        logger.info(f"Updating invoice with ID: {invoice_id}")
        try:
            # Convert Pydantic model to dict, excluding None values
            update_dict = update_data.dict(exclude_none=True)
            
            # Update invoice in database
            updated_invoice = await self.repo.update_invoice(invoice_id, update_dict.copy())
            
            if not updated_invoice:
                logger.error(f"Invoice with ID {invoice_id} not found")
                raise ValueError(f"Invoice with ID {invoice_id} not found")
            
            logger.info(f"Invoice {invoice_id} updated successfully")
            
            # Convert to response format
            response_data = {
                "id": updated_invoice.id,
                "invoice_number": updated_invoice.invoice_number,
                "invoice_date": updated_invoice.invoice_date,
                "customer_name": updated_invoice.customer_name,
                "vendor_name": updated_invoice.vendor_name,
                "total_amount": updated_invoice.total_amount,
                "items": [
                    {
                        "id": item.id,
                        "item_description": item.item_description,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "total_amount": item.total_amount
                    }
                    for item in updated_invoice.items
                ]
            }
            
            return updated_invoice, response_data
        except Exception as e:
            logger.error(f"Error updating invoice: {str(e)}")
            raise ValueError(f"Error updating invoice: {str(e)}")

    async def get_all_invoices(self):
        logger.info("Fetching all invoices from database")
        try:
            invoices = await self.repo.get_all_invoices()
            
            # Convert to response format
            response_data = []
            for invoice in invoices:
                invoice_data = {
                    "id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "invoice_date": invoice.invoice_date,
                    "customer_name": invoice.customer_name,
                    "vendor_name": invoice.vendor_name,
                    "total_amount": invoice.total_amount,
                    "items": [
                        {
                            "id": item.id,
                            "item_description": item.item_description,
                            "quantity": item.quantity,
                            "unit_price": item.unit_price,
                            "total_amount": item.total_amount
                        }
                        for item in invoice.items
                    ]
                }
                response_data.append(invoice_data)
            
            logger.info(f"Successfully fetched {len(response_data)} invoices")
            return response_data
        except Exception as e:
            logger.error(f"Error fetching all invoices: {str(e)}")
            raise ValueError(f"Error fetching invoices: {str(e)}")

    async def get_all_invoices_paginated(self, page: int = 1, limit: int = 10, sort_by: str = "id", sort_order: str = "desc", search: str = None, date_from: str = None, date_to: str = None):
        logger.info(f"Fetching invoices with pagination: page={page}, limit={limit}, sort_by={sort_by}")
        try:
            result = await self.repo.get_all_invoices_paginated(
                page=page,
                limit=limit,
                sort_by=sort_by,
                sort_order=sort_order,
                search=search,
                date_from=date_from,
                date_to=date_to
            )
            
            # Convert to response format
            response_data = []
            for invoice in result['invoices']:
                invoice_data = {
                    "id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "invoice_date": invoice.invoice_date,
                    "customer_name": invoice.customer_name,
                    "vendor_name": invoice.vendor_name,
                    "total_amount": invoice.total_amount,
                    "items": [
                        {
                            "id": item.id,
                            "item_description": item.item_description,
                            "quantity": item.quantity,
                            "unit_price": item.unit_price,
                            "total_amount": item.total_amount
                        }
                        for item in invoice.items
                    ]
                }
                response_data.append(invoice_data)
            
            logger.info(f"Successfully fetched {len(response_data)} invoices")
            return {
                'data': response_data,
                'total': result['total']
            }
        except Exception as e:
            logger.error(f"Error fetching paginated invoices: {str(e)}")
            raise ValueError(f"Error fetching invoices: {str(e)}")

    async def get_invoice_by_id(self, invoice_id: int):
        logger.info(f"Fetching invoice with ID: {invoice_id}")
        try:
            invoice = await self.repo.get_invoice_by_id(invoice_id)
            
            if not invoice:
                logger.error(f"Invoice with ID {invoice_id} not found")
                raise ValueError(f"Invoice with ID {invoice_id} not found")
            
            # Convert to response format
            response_data = {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "invoice_date": invoice.invoice_date,
                "customer_name": invoice.customer_name,
                "vendor_name": invoice.vendor_name,
                "total_amount": invoice.total_amount,
                "items": [
                    {
                        "id": item.id,
                        "item_description": item.item_description,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "total_amount": item.total_amount
                    }
                    for item in invoice.items
                ]
            }
            
            logger.info(f"Successfully fetched invoice {invoice_id}")
            return response_data
        except Exception as e:
            logger.error(f"Error fetching invoice by ID: {str(e)}")
            raise ValueError(f"Error fetching invoice: {str(e)}")
