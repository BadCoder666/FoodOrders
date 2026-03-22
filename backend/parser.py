import json
import os
from groq import Groq


def parse_order_message(message: str) -> dict:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    system_prompt = """You are an expert at extracting food order information from messages.
Extract all available order details and return a JSON object with exactly these fields:
- menu_name: name of the restaurant or menu (string or null)
- customer_name: name of the customer (string or null)
- phone_no: phone number of the customer (string or null)
- dish_ordered: name of the dish or food item (string or null)
- quantity: number of items ordered (integer or null)
- order_amount: total order amount as a number (number or null)
- payment_status: one of "Paid", "Unpaid", "Pending" (or null if not mentioned)

Return only valid JSON. Use null for any field not found in the message."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Extract order details from this message:\n\n{message}"}
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    data = json.loads(response.choices[0].message.content)

    # Ensure payment_status is one of the valid options
    if data.get("payment_status") not in ["Paid", "Unpaid", "Pending"]:
        data["payment_status"] = None

    return data
