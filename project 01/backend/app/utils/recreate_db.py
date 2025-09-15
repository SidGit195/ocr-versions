
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import random
from app.models.base import Base
from app.models.invoice import Invoice, Item
from app.core.config import settings

# Ensure sync driver for DDL
sync_db_url = settings.DATABASE_URL.replace('postgresql+asyncpg', 'postgresql')
sync_engine = create_engine(sync_db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

# Sample data for generating realistic invoices
VENDORS = [
    "Tech Solutions Inc", "Global Supply Co", "Premium Services Ltd", "Digital Innovations",
    "Smart Systems Corp", "Elite Manufacturing", "Future Technologies", "Advanced Solutions",
    "Quality Products Inc", "Professional Services Co", "Modern Industries", "Strategic Partners",
    "Dynamic Enterprises", "Creative Solutions", "Innovative Designs", "Superior Quality Co",
    "Excellence Group", "Premier Suppliers", "Top Tier Services", "Ultimate Solutions"
]

CUSTOMERS = [
    "ABC Corporation", "XYZ Industries", "Metro Business Group", "City Center Mall",
    "Downtown Enterprises", "Suburban Services", "Urban Solutions", "Regional Partners",
    "National Chain Store", "Local Business Hub", "Commercial Complex", "Trade Center",
    "Business District Co", "Shopping Plaza", "Office Complex", "Industrial Park",
    "Corporate Center", "Executive Suites", "Professional Plaza", "Commerce Building"
]

ITEMS = [
    {"desc": "Office Supplies Bundle", "price_range": (25, 150)},
    {"desc": "Computer Hardware", "price_range": (200, 2000)},
    {"desc": "Software License", "price_range": (100, 500)},
    {"desc": "Office Furniture", "price_range": (150, 800)},
    {"desc": "Printing Services", "price_range": (50, 300)},
    {"desc": "Maintenance Service", "price_range": (75, 400)},
    {"desc": "Consulting Hours", "price_range": (100, 200)},
    {"desc": "Equipment Rental", "price_range": (80, 600)},
    {"desc": "Storage Solutions", "price_range": (120, 450)},
    {"desc": "Network Setup", "price_range": (300, 1200)},
    {"desc": "Security System", "price_range": (400, 1500)},
    {"desc": "Training Materials", "price_range": (30, 200)},
    {"desc": "Marketing Package", "price_range": (250, 800)},
    {"desc": "Design Services", "price_range": (150, 600)},
    {"desc": "Technical Support", "price_range": (60, 300)}
]

def recreate_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=sync_engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=sync_engine)
    print("Database schema recreated successfully.")

def create_dummy_data():
    """Create 30 dummy invoices with realistic data"""
    print("Creating 30 dummy invoices...")
    
    db = SessionLocal()
    try:
        for i in range(30):
            # Generate invoice data
            invoice_number = f"INV-{2024}-{(i+1):04d}"
            
            # Random date within last 6 months
            start_date = datetime.now() - timedelta(days=180)
            random_days = random.randint(0, 180)
            invoice_date = start_date + timedelta(days=random_days)
            
            vendor_name = random.choice(VENDORS)
            customer_name = random.choice(CUSTOMERS)
            
            # Generate 1-5 items per invoice
            num_items = random.randint(1, 5)
            total_amount = 0.0
            
            # Create invoice
            invoice = Invoice(
                invoice_number=invoice_number,
                invoice_date=invoice_date.date(),
                vendor_name=vendor_name,
                customer_name=customer_name,
                total_amount="0.00"  # Will be updated after adding items
            )
            
            db.add(invoice)
            db.flush()  # Get the invoice ID
            
            # Create items
            for item_idx in range(num_items):
                item_data = random.choice(ITEMS)
                quantity = random.randint(1, 10)
                unit_price = random.uniform(*item_data["price_range"])
                item_total = quantity * unit_price
                total_amount += item_total
                
                item = Item(
                    invoice_id=invoice.id,
                    item_description=item_data["desc"],
                    quantity=str(quantity),
                    unit_price=f"{unit_price:.2f}",
                    total_amount=f"{item_total:.2f}"
                )
                
                db.add(item)
            
            # Update invoice total
            invoice.total_amount = f"{total_amount:.2f}"
            
            if (i + 1) % 10 == 0:
                print(f"Created {i + 1} invoices...")
        
        db.commit()
        print("Successfully created 30 dummy invoices!")
        
    except Exception as e:
        print(f"Error creating dummy data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    recreate_db()
    create_dummy_data()
