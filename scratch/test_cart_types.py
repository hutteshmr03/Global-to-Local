import traceback
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app, raise_server_exceptions=True)

for payload in [
    {'product_id': 6346, 'quantity': 6},
    {'product_id': '6346', 'quantity': 6},
    {'product_id': 'wine-biscuits-200-grams', 'quantity': 6},
]:
    try:
        res = client.post('/api/v1/cart/items', json=payload)
        print('Payload', payload, '->', res.status_code)
    except Exception as e:
        print('Payload', payload, 'FAILED:')
        traceback.print_exc()
