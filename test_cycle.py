import urllib.request
import json

base_url = 'https://utzzymmcfxanfzpiverr.supabase.co/rest/v1'
headers = {
    'apikey': 'sb_publishable_XZc-B9W9iTlJpIsxGPXLng_SWKlYICx',
    'Authorization': 'Bearer sb_publishable_XZc-B9W9iTlJpIsxGPXLng_SWKlYICx',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 1. Fetch products
print("--- FETCHING CATALOG ---")
req_prod = urllib.request.Request(f"{base_url}/Product?select=*&order=id.asc", headers=headers)
with urllib.request.urlopen(req_prod) as resp:
    prods = json.loads(resp.read().decode('utf-8'))
    print(f"Catalog has {len(prods)} products in Supabase:")
    for p in prods[:3]:
        print(f"  [ID {p['id']}] {p['Company']} - {p['Customer_Name']} | Price: ${p['Actual_Amount']} (Stock: {p['Is_available']})")

# 2. Insert sample purchase order
print("\n--- PLACING SAMPLE ORDER ---")
test_order = {
    'Order_ID': prods[0]['id'], # First product
    'Customer_name': 'Eleanor Sterling',
    'Customer_Ph_No': 9876543210,
    'Purchase_Product': prods[0]['Customer_Name'],
    'Customer_Address': '742 Evergreen Terrace, Springfield, CA 90210'
}
req_order = urllib.request.Request(f"{base_url}/Order", data=json.dumps(test_order).encode('utf-8'), headers=headers, method='POST')
with urllib.request.urlopen(req_order) as resp:
    created = json.loads(resp.read().decode('utf-8'))[0]
    print(f"Success! Order Created: Customer_Id={created['Customer_Id']}, Product={created['Purchase_Product']}, Customer={created['Customer_name']}")

# 3. Update product availability to false
print("\n--- UPDATING PRODUCT STOCK STATUS ---")
req_update = urllib.request.Request(
    f"{base_url}/Product?id=eq.{prods[0]['id']}", 
    data=json.dumps({'Is_available': False}).encode('utf-8'), 
    headers=headers, 
    method='PATCH'
)
with urllib.request.urlopen(req_update) as resp:
    print(f"Product {prods[0]['id']} marked as unavailable / sold.")

# 4. Fetch orders to verify
print("\n--- QUERYING ORDERS TABLE ---")
req_get_orders = urllib.request.Request(f"{base_url}/Order?select=*&order=Customer_Id.desc", headers=headers)
with urllib.request.urlopen(req_get_orders) as resp:
    orders = json.loads(resp.read().decode('utf-8'))
    print(f"Total Orders in Supabase: {len(orders)}")
    for o in orders:
        print(f"  Receipt #{o['Customer_Id']} | {o['Customer_name']} ({o['Customer_Ph_No']}) -> {o['Purchase_Product']}")
