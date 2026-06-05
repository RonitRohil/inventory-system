def test_create_order_deducts_stock(client, product, customer):
    r = client.post(
        "/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 5}]},
    )
    assert r.status_code == 201
    assert r.json()["total_amount"] == 50.0  # 10.0 × 5

    updated = client.get(f"/products/{product['id']}").json()
    assert updated["quantity"] == 45  # 50 − 5


def test_create_order_insufficient_stock_returns_400(client, product, customer):
    r = client.post(
        "/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 999}]},
    )
    assert r.status_code == 400
    assert "Insufficient stock" in r.json()["detail"]

    # Stock must be unchanged after the rejection
    assert client.get(f"/products/{product['id']}").json()["quantity"] == 50


def test_cancel_order_restores_stock(client, product, customer):
    r = client.post(
        "/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "quantity": 10}]},
    )
    order_id = r.json()["id"]

    assert client.delete(f"/orders/{order_id}").status_code == 204

    restored = client.get(f"/products/{product['id']}").json()
    assert restored["quantity"] == 50  # fully restored


def test_create_order_unknown_customer_returns_404(client, product):
    r = client.post(
        "/orders",
        json={"customer_id": 9999, "items": [{"product_id": product["id"], "quantity": 1}]},
    )
    assert r.status_code == 404


def test_create_order_unknown_product_returns_404(client, customer):
    r = client.post(
        "/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": 9999, "quantity": 1}]},
    )
    assert r.status_code == 404
