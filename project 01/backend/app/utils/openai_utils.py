from openai import OpenAI
from fastapi import HTTPException
from app.core.config import settings
import base64

OPENAI_API_KEY = settings.OPENAI_API_KEY
PROMPT = """
Extract the following fields from the invoice and return ONLY a strict JSON object in snake_case with this exact top-level structure:
{
    "invoice_date": "",
    "invoice_number": "",
    "customer_name": "",
    "vendor_name": "",
    "total_amount": "",
    "items": [
        {
            "item_description": "",
            "quantity": "",
            "unit_price": "",
            "total_amount": ""
        }
    ]
}

IMPORTANT FORMATTING RULES:
- invoice_date: Must be in YYYY-MM-DD format (e.g., "2025-01-15"). Convert any date format to this standard.
- invoice_number: Extract as-is from the invoice
- customer_name: The company/person being billed (Bill To)
- vendor_name: The company issuing the invoice (From)
- total_amount: Final total amount as string number (e.g., "1234.56")
- items: Array of all line items with descriptions, quantities, unit prices, and amounts

Do not include any markdown, code blocks, explanations, or additional keys. Return only the JSON object.
"""

client = OpenAI(api_key=OPENAI_API_KEY)

def extract_invoice_data(file):
    file_bytes = file.file.read()
    base64_image = base64.b64encode(file_bytes).decode("utf-8")
    image_data_url = f"data:image/jpeg;base64,{base64_image}"

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract invoice data as JSON."},
                        {"type": "image_url", "image_url": {"url": image_data_url}}
                    ]
                }
            ],
            max_tokens=1000
        )
        extracted_json = response.choices[0].message.content
        return extracted_json
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
