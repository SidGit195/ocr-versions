from app.core.logger import logger

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.invoice_service import InvoiceService
from app.schemas.invoice import InvoiceUpdate
from typing import Optional

router = APIRouter()

@router.post("/upload-invoice")
async def upload_invoice(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
	logger.info(f"Received invoice upload request: {file.filename}")
	try:
		service = InvoiceService(db)
		invoice_obj, extracted_json, status = await service.process_and_store_invoice(file)
		
		if status == "already_parsed":
			logger.info(f"Invoice {extracted_json.get('invoice_number')} already exists")
			response_data = {
				"status": "already_parsed", 
				"id": invoice_obj.id if invoice_obj else extracted_json.get("id"),  # Use invoice object ID if available
				"invoice_number": extracted_json.get("invoice_number"),
				"date": extracted_json.get("invoice_date"),
				"vendor_name": extracted_json.get("vendor_name"),
				"customer_name": extracted_json.get("customer_name"),
				"total": extracted_json.get("total_amount"),
				"items": extracted_json.get("items", [])
			}
			logger.info(f"Returning already_parsed response with ID: {response_data['id']}")
			return response_data
		else:
			logger.info(f"Invoice processed and stored: {getattr(invoice_obj, 'id', None)}")
			# Create a proper response with all fields needed by frontend
			# Include the ID from the created invoice object
			response_data = {
				"status": "success",
				"id": invoice_obj.id,  # Use the ID from the saved invoice object
				"invoice_number": extracted_json.get("invoice_number"),
				"date": extracted_json.get("invoice_date"),
				"vendor_name": extracted_json.get("vendor_name"),
				"customer_name": extracted_json.get("customer_name"),
				"total": extracted_json.get("total_amount"),
				"items": extracted_json.get("items", [])
			}
			logger.info(f"Returning response with ID: {response_data['id']}")
			return response_data
	except Exception as e:
		logger.error(f"Error processing invoice: {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-invoice/{invoice_id}")
async def update_invoice(
	invoice_id: int,
	update_data: InvoiceUpdate,
	db: AsyncSession = Depends(get_db)
):
	logger.info(f"Received invoice update request for ID: {invoice_id}")
	try:
		service = InvoiceService(db)
		invoice_obj, response_data = await service.update_invoice(invoice_id, update_data)
		logger.info(f"Invoice {invoice_id} updated successfully")
		return {
			"status": "success", 
			"message": "Invoice updated successfully",
			"data": response_data
		}
	except ValueError as ve:
		logger.error(f"Validation error updating invoice: {str(ve)}")
		raise HTTPException(status_code=404, detail=str(ve))
	except Exception as e:
		logger.error(f"Error updating invoice: {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.get("/invoices")
async def get_invoices(
	page: int = Query(1, ge=1, description="Page number"),
	limit: int = Query(10, ge=1, le=100, description="Items per page"),
	sort_by: Optional[str] = Query("id", description="Field to sort by"),
	sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$", description="Sort order"),
	search: Optional[str] = Query(None, description="Search term"),
	date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
	date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
	db: AsyncSession = Depends(get_db)
):
	logger.info(f"Received request to get invoices with pagination: page={page}, limit={limit}")
	try:
		service = InvoiceService(db)
		result = await service.get_all_invoices_paginated(
			page=page,
			limit=limit,
			sort_by=sort_by,
			sort_order=sort_order,
			search=search,
			date_from=date_from,
			date_to=date_to
		)
		logger.info(f"Retrieved {len(result['data'])} invoices, total: {result['total']}")
		return {
			"status": "success",
			"data": result['data'],
			"pagination": {
				"page": page,
				"limit": limit,
				"total": result['total'],
				"pages": (result['total'] + limit - 1) // limit
			}
		}
	except Exception as e:
		logger.error(f"Error fetching invoices: {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))

@router.get("/invoice/{invoice_id}")
async def get_invoice_by_id(
	invoice_id: int,
	db: AsyncSession = Depends(get_db)
):
	logger.info(f"Received request to get invoice with ID: {invoice_id}")
	try:
		service = InvoiceService(db)
		invoice = await service.get_invoice_by_id(invoice_id)
		logger.info(f"Retrieved invoice {invoice_id} successfully")
		return {
			"status": "success",
			"data": invoice
		}
	except ValueError as ve:
		logger.error(f"Invoice not found: {str(ve)}")
		raise HTTPException(status_code=404, detail=str(ve))
	except Exception as e:
		logger.error(f"Error fetching invoice: {str(e)}")
		raise HTTPException(status_code=500, detail=str(e))
