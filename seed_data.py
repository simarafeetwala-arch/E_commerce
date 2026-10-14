import urllib.request
import json

url = 'https://utzzymmcfxanfzpiverr.supabase.co/rest/v1/Product'
headers = {
    'apikey': 'sb_publishable_XZc-B9W9iTlJpIsxGPXLng_SWKlYICx',
    'Authorization': 'Bearer sb_publishable_XZc-B9W9iTlJpIsxGPXLng_SWKlYICx',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

products = [
    {
        'Company': 'Sony',
        'Customer_Name': 'Sony WH-1000XM5 Noise Canceling Headphones',
        'Product_Description': 'Industry-leading noise cancellation, crystal-clear hands-free calling, and up to 30-hour battery life with ultra-comfortable lightweight design.',
        'Order': 399.0,
        'Discount_amount': 50.0,
        'Actual_Amount': 349.0,
        'Image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        'Is_available': True
    },
    {
        'Company': 'Apple',
        'Customer_Name': 'MacBook Pro 16" M3 Max Liquid Retina',
        'Product_Description': 'Supercharged by M3 Max with Liquid Retina XDR display, 36GB unified memory, and 1TB SSD storage for professional workflows.',
        'Order': 3499.0,
        'Discount_amount': 300.0,
        'Actual_Amount': 3199.0,
        'Image_url': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        'Is_available': True
    },
    {
        'Company': 'Samsung',
        'Customer_Name': 'Galaxy S24 Ultra 5G AI Phone',
        'Product_Description': 'Galaxy AI with built-in S-Pen, 200MP camera sensor, and Snapdragon 8 Gen 3 processor in titanium gray.',
        'Order': 1299.0,
        'Discount_amount': 150.0,
        'Actual_Amount': 1149.0,
        'Image_url': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
        'Is_available': True
    },
    {
        'Company': 'Bose',
        'Customer_Name': 'Bose QuietComfort Ultra Earbuds',
        'Product_Description': 'Breakthrough spatialized audio with world-class noise cancellation, CustomTune technology, and IPX4 water resistance.',
        'Order': 299.0,
        'Discount_amount': 30.0,
        'Actual_Amount': 269.0,
        'Image_url': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        'Is_available': True
    },
    {
        'Company': 'Nike',
        'Customer_Name': 'Nike Air Max Pulse Roam Edition',
        'Product_Description': 'Engineered textile upper with wrapped midsole and point-loaded Air cushioning for supreme lifestyle and athletic comfort.',
        'Order': 180.0,
        'Discount_amount': 25.0,
        'Actual_Amount': 155.0,
        'Image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        'Is_available': True
    },
    {
        'Company': 'Dyson',
        'Customer_Name': 'Dyson V15 Detect Absolute Vacuum',
        'Product_Description': 'Laser reveals microscopic dust with piezo sensor calculating debris and 60 minutes of powerful fade-free suction.',
        'Order': 749.0,
        'Discount_amount': 80.0,
        'Actual_Amount': 669.0,
        'Image_url': 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
        'Is_available': True
    },
    {
        'Company': 'Dell',
        'Customer_Name': 'Dell UltraSharp 32" 4K HDR Monitor',
        'Product_Description': 'IPS Black technology with 2000:1 contrast ratio, 98% DCI-P3 color gamut, and 90W USB-C single cable power delivery.',
        'Order': 899.0,
        'Discount_amount': 100.0,
        'Actual_Amount': 799.0,
        'Image_url': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
        'Is_available': True
    }
]

req = urllib.request.Request(url, data=json.dumps(products).encode('utf-8'), headers=headers, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        print('SEED STATUS:', resp.status)
        print('Inserted:', len(json.loads(resp.read().decode('utf-8'))), 'products')
except urllib.error.HTTPError as e:
    print('ERROR:', e.code, e.read().decode('utf-8'))
except Exception as e:
    print('ERROR:', e)
