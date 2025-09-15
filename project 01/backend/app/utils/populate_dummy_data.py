import asyncio
import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.invoice import Invoice, Item
from app.core.logger import logger

# Dummy data for generating realistic invoices
VENDORS = [
    "Naguntak Sarees Center",
    "Ridhi Sidhi Sarees", 
    "Krishna Fashion Hub",
    "Raj Super Wholesale Bazar",
    "Shree Ram Textiles",
    "Modern Fashion Store",
    "Golden Silk House",
    "Royal Collection",
    "Aditya Garments",
    "Fashion Point",
    "Style Zone",
    "Trendy Collections",
    "Elite Fashion",
    "Premium Textiles",
    "Classic Wear",
]

CUSTOMERS = [
    "Baghawan Fashion Collection",
    "Madhav Fashion",
    "RAJ DATA PROCESSORS",
    "Fashion World Retail",
    "Style Plaza",
    "Modern Boutique",
    "Trendy Collections Store",
    "Elite Fashion House",
    "Royal Garments",
    "Fashion Hub Retail",
    "Classic Style Store",
    "Premium Fashion",
    "Designer Collections",
    "Fashion Gallery",
    "Style Center",
]

ITEMS = [
    {"name": "Cotton Saree", "base_price": 800},
    {"name": "Silk Saree", "base_price": 1500},
    {"name": "Designer Blouse", "base_price": 600},
    {"name": "Kurti Set", "base_price": 450},
    {"name": "Lehenga Choli", "base_price": 2000},
    {"name": "Salwar Suit", "base_price": 900},
    {"name": "Dupatta", "base_price": 300},
    {"name": "Palazzo Set", "base_price": 750},
    {"name": "Anarkali Dress", "base_price": 1200},
    {"name": "Sharara Set", "base_price": 1800},
    {"name": "Georgette Saree", "base_price": 950},
    {"name": "Chiffon Saree", "base_price": 1100},
    {"name": "Banarasi Saree", "base_price": 2500},
    {"name": "Kota Doria Saree", "base_price": 650},
    {"name": "Handloom Saree", "base_price": 850},
]

def generate_invoice_number():
    """Generate random invoice number"""
    prefixes = ["INV", "SRR", "BIL", "RCP", "DOC"]
    prefix = random.choice(prefixes)
    number = random.randint(100, 9999)
    return f"{prefix}/{number}"

def generate_random_date():
    """Generate random date within last 6 months"""
    start_date = datetime.now() - timedelta(days=180)
    end_date = datetime.now()
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return start_date + timedelta(days=random_days)

def generate_invoice_items():
    """Generate 1-5 random items for an invoice"""
    num_items = random.randint(1, 5)
    selected_items = random.sample(ITEMS, num_items)
    
    items = []
    for item in selected_items:
        quantity = random.randint(1, 20)
        # Add some price variation (±20%)
        base_price = item["base_price"]
        price_variation = random.uniform(0.8, 1.2)
        unit_price = round(base_price * price_variation, 2)
        total = round(quantity * unit_price, 2)
        
        items.append({
            "item_description": item["name"],
            "quantity": str(quantity),
            "unit_price": str(unit_price),
            "total_amount": str(total)
        })
    
    return items

async def create_dummy_invoices(db: AsyncSession, count: int = 30):
    """Create dummy invoices in the database"""
    logger.info(f"Creating {count} dummy invoices...")
    
    created_count = 0
    
    for i in range(count):
        try:
            # Generate invoice data
            invoice_number = generate_invoice_number()
            vendor_name = random.choice(VENDORS)
            customer_name = random.choice(CUSTOMERS)
            invoice_date = generate_random_date().strftime("%d/%m/%Y")
            
            # Generate items
            items_data = generate_invoice_items()
            total_amount = sum(float(item["total_amount"]) for item in items_data)
            
            # Create invoice
            invoice = Invoice(
                invoice_number=invoice_number,
                vendor_name=vendor_name,
                customer_name=customer_name,
                invoice_date=invoice_date,
                total_amount=str(round(total_amount, 2))
            )
            
            db.add(invoice)
            await db.flush()  # Get invoice.id
            
            # Create items
            for item_data in items_data:
                item = Item(
                    invoice_id=invoice.id,
                    item_description=item_data["item_description"],
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    total_amount=item_data["total_amount"]
                )
                db.add(item)
            
            await db.commit()
            created_count += 1
            logger.info(f"Created invoice {created_count}/{count}: {invoice_number}")
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating invoice {i+1}: {str(e)}")
            continue
    
    logger.info(f"Successfully created {created_count} dummy invoices!")
    return created_count

async def main():
    """Main function to populate dummy data"""
    try:
        # Get database session
        async with AsyncSessionLocal() as db:
            # Create 30 dummy invoices
            count = await create_dummy_invoices(db, 30)
            print(f"\n✅ Successfully created {count} dummy invoices!")
            print("🔄 Refresh your frontend to see the new data with pagination!")
            
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting dummy data population...")
    print("📊 Creating 30 sample invoices with realistic data...")
    asyncio.run(main())
