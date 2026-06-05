def test_create_product_returns_201(client):
    r = client.post(
        "/products",
        json={"name": "Widget", "sku": "WGT-001", "price": 9.99, "quantity": 100},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["sku"] == "WGT-001"
    assert data["quantity"] == 100
    assert data["id"] is not None


def test_duplicate_sku_returns_409(client):
    payload = {"name": "Widget", "sku": "WGT-001", "price": 9.99, "quantity": 100}
    client.post("/products", json=payload)
    r = client.post("/products", json={**payload, "name": "Widget Copy"})
    assert r.status_code == 409
    assert "WGT-001" in r.json()["detail"]


def test_update_product_price(client, product):
    r = client.put(f"/products/{product['id']}", json={"price": 14.99})
    assert r.status_code == 200
    assert r.json()["price"] == 14.99
    # Other fields unchanged
    assert r.json()["sku"] == product["sku"]


def test_delete_product_returns_204(client, product):
    r = client.delete(f"/products/{product['id']}")
    assert r.status_code == 204
    # Confirm it's gone
    assert client.get(f"/products/{product['id']}").status_code == 404


def test_delete_nonexistent_product_is_idempotent(client):
    r = client.delete("/products/9999")
    assert r.status_code == 204


def test_delete_product_with_existing_orders_returns_409(client, product, customer):
    """Deleting a product that is part of an order must fail with 409, not 500."""
    client.post(
        "/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 1}]},
    )
    r = client.delete(f"/products/{product['id']}")
    assert r.status_code == 409
    assert "existing orders" in r.json()["detail"]
