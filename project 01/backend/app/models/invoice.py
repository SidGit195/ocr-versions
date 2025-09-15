from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class Invoice(Base):
	__tablename__ = 'invoices'
	id = Column(Integer, primary_key=True, index=True)
	invoice_number = Column(String, unique=True, index=True)
	invoice_date = Column(String)
	customer_name = Column(String)
	vendor_name = Column(String)
	total_amount = Column(String)
	items = relationship("Item", back_populates="invoice")

class Item(Base):
	__tablename__ = 'items'
	id = Column(Integer, primary_key=True, index=True)
	invoice_id = Column(Integer, ForeignKey('invoices.id'))
	item_description = Column(String)
	quantity = Column(String)
	unit_price = Column(String)
	total_amount = Column(String)
	invoice = relationship("Invoice", back_populates="items")
