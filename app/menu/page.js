"use client";

import { useEffect, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import Header from "@/components/Header";
import MenuCard from "@/components/MenuCard";

export default function MenuPage() {
  const itemsPerLoad = 2;
  const [menu, setMenu] = useState([]);
  const [menuError, setMenuError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(2);
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", deliveryDate: "" });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    fetch("/api/menu")
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) {
          setMenu(data.items || []);
        } else {
          setMenuError("Could not load the menu.");
        }
      })
      .catch(() => setMenuError("Could not load the menu."));
  }, []);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem("tiffin-cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch {
      // Ignore unavailable or invalid saved cart data.
    } finally {
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (cartLoaded) {
      window.localStorage.setItem("tiffin-cart", JSON.stringify(cart));
    }
  }, [cart, cartLoaded]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((count, cartItem) => count + cartItem.qty, 0);
  const cartTotal = cartItems.reduce(
    (total, cartItem) => total + cartItem.qty * cartItem.item.price,
    0
  );

  const addToCart = (item) => {
    setCart((previousCart) => ({
      ...previousCart,
      [item.id]: {
        item,
        qty: (previousCart[item.id]?.qty || 0) + 1,
      },
    }));
  };

  const setQty = (id, quantity) => {
    setCart((previousCart) => {
      if (quantity <= 0) {
        const nextCart = { ...previousCart };
        delete nextCart[id];
        return nextCart;
      }
      return {
        ...previousCart,
        [id]: { item: previousCart[id].item, qty: quantity },
      };
    });
  };

  const openCheckout = () => {
    setCheckoutOpen(true);
    setCartOpen(false);
    setFormError(null);
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setFormError("Please fill in your name, phone and delivery address.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          deliveryDate: form.deliveryDate,
          items: cartItems.map((cartItem) => ({
            id: cartItem.item.id,
            name: cartItem.item.name,
            qty: cartItem.qty,
            price: cartItem.item.price,
          })),
          total: Math.round(cartTotal * 100) / 100,
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setConfirmed({ orderId: data.orderId, stored: data.stored, name: form.name.trim() });
        setCart({});
        setCheckoutOpen(false);
        setForm({ name: "", phone: "", address: "", deliveryDate: "" });
      } else {
        setFormError(data.error || "Something went wrong placing your order.");
      }
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <>
        <Header cartCount={0} onCart={() => {}} />
        <main className="confirmation">
          <div className="check">✓</div>
          <h2>Order received — thank you, {confirmed.name || "friend"}!</h2>
          <p>We&apos;ll call you shortly to confirm delivery.</p>
          <div className="order-id">Order ID: {confirmed.orderId}</div>
          <p>
            {confirmed.stored
              ? "Your order was saved by our kitchen team."
              : "Demo mode: this order was not saved to a database."}
          </p>
          <button className="btn secondary" onClick={() => setConfirmed(null)}>
            Back to the menu
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        cartCount={cartCount}
        onCart={() => setCartOpen(true)}
        showBackHome
      />

      <main className="section menu-page">
        <h1>Our Menu</h1>
        {menuError && <div className="error-box">{menuError}</div>}
        {!menuError && menu.length === 0 && (
          <div className="loading">Loading menu…</div>
        )}
        <div className="menu-grid">
          {menu.slice(0, visibleCount).map((item) => (
            <MenuCard item={item} onAdd={addToCart} key={item.id} />
          ))}
        </div>
        {visibleCount < menu.length && (
          <div className="menu-more">
            <button
              className="btn secondary"
              onClick={() =>
                setVisibleCount((count) =>
                  Math.min(count + itemsPerLoad, menu.length)
                )
              }
            >
              Show more
            </button>
          </div>
        )}
      </main>

      {cartOpen && (
        <CartDrawer
          cartItems={cartItems}
          cartCount={cartCount}
          cartTotal={cartTotal}
          onSetQty={setQty}
          onClose={() => setCartOpen(false)}
          onCheckout={openCheckout}
        />
      )}

      {checkoutOpen && (
        <CheckoutDrawer
          cartItems={cartItems}
          cartTotal={cartTotal}
          form={form}
          formError={formError}
          submitting={submitting}
          onChange={(field, value) => setForm({ ...form, [field]: value })}
          onClose={() => setCheckoutOpen(false)}
          onSubmit={submitOrder}
        />
      )}
    </>
  );
}