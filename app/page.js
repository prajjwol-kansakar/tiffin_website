"use client";

import { useEffect, useMemo, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MenuCard from "@/components/MenuCard";

const money = (n) => `$${Number(n).toFixed(2)}`;

export default function HomePage() {
  const [menu, setMenu] = useState([]);
  const [menuSource, setMenuSource] = useState(null);
  const [menuError, setMenuError] = useState(null);
  const [cart, setCart] = useState({}); // id -> { item, qty }
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", deliveryDate: "" });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // { orderId, stored }

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setMenu(data.items || []);
          setMenuSource(data.source || null);
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

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(
    () => cartItems.reduce((n, c) => n + c.qty, 0),
    [cartItems]
  );
  const cartTotal = useMemo(
    () => cartItems.reduce((n, c) => n + c.qty * c.item.price, 0),
    [cartItems]
  );

  useEffect(() => {
    if (cartLoaded && cartItems.length > 0 && window.location.search.includes("checkout=true")) {
      setCheckoutOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [cartLoaded, cartItems.length]);

  const addToCart = (item) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, qty: (prev[item.id]?.qty || 0) + 1 },
    }));
  };

  const setQty = (id, qty) => {
    setCart((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { item: prev[id].item, qty } };
    });
  };

  const openCheckout = () => {
    setCheckoutOpen(true);
    setCartOpen(false);
    setFormError(null);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setFormError("Please fill in your name, phone and delivery address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          address: form.address,
          deliveryDate: form.deliveryDate,
          items: cartItems.map((c) => ({
            id: c.item.id,
            name: c.item.name,
            qty: c.qty,
            price: c.item.price,
          })),
          total: Math.round(cartTotal * 100) / 100,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setConfirmed({
          orderId: data.orderId,
          stored: data.stored,
          name: form.name.trim(),
        });
        setCart({});
        setCheckoutOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
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
          <p>
            Your tiffin is being packed with love. We&apos;ll call you shortly to
            confirm delivery.
          </p>
          <div className="order-id">Order ID: {confirmed.orderId}</div>
          <p>
            {confirmed.stored
              ? "Your order was saved by our kitchen team."
              : "Demo mode: this order was not saved to a database (demo checkout)."}
          </p>
          <button
            className="btn secondary"
            onClick={() => {
              setConfirmed(null);
              setForm({ name: "", phone: "", address: "", deliveryDate: "" });
            }}
          >
            Back to the menu
          </button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header cartCount={cartCount} onCart={() => setCartOpen(true)} />

      <section className="hero">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1800&q=85"
          alt="Fresh home-style meal served in a bowl"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="kicker">Home-style • Fresh daily • Delivered hot</span>
          <h1>A Fresh Home Made Tiffin</h1>
          <p>
            Ghar jaisa khana, delivered to your door. Wholesome tiffins cooked
            fresh every morning — just like home.
          </p>
          <a href="#menu" className="btn">
            Order Now
          </a>
        </div>
      </section>

      <section className="section">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="num">1</div>
            <h3>Pick your tiffin</h3>
            <p>Choose from daily tiffins, plans and add-ons on the menu below.</p>
          </div>
          <div className="step">
            <div className="num">2</div>
            <h3>Place your order</h3>
            <p>Add items to your cart and check out with your delivery details.</p>
          </div>
          <div className="step">
            <div className="num">3</div>
            <h3>Enjoy at your door</h3>
            <p>We cook fresh and deliver hot, right on time for your meal.</p>
          </div>
        </div>
      </section>

      <section id="menu" className="section">
        <h2>Our Menu</h2>
        {menuSource === "sample" && (
          <p className="menu-note">
            <strong>Sample menu</strong> — demo items with USD prices, to be
            replaced with the real menu.
          </p>
        )}
        {menuError && <div className="error-box">{menuError}</div>}
        {!menuError && menu.length === 0 && (
          <div className="loading">Loading menu…</div>
        )}
        <div className="menu-preview">
          <div className="menu-grid menu-preview-grid">
            {menu.slice(0, 4).map((item) => (
              <div className="menu-card" key={item.id}>
                {item.image && (
                  <img
                    className="menu-card-image"
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                  />
                )}
                {item.tag && <span className="tag">{item.tag}</span>}
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="row">
                  <span className="price">{money(item.price)}</span>
                  <button className="add-btn" onClick={() => addToCart(item)}>
                    Add +
                  </button>
                </div>
              </div>
            ))}
          </div>
          {menu.length > 4 && (
            <div className="menu-more">
              <a href="/menu" className="btn secondary">
                Show more <span aria-hidden="true">→</span>
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="plans">
          <h2>Weekly &amp; Monthly Plans</h2>
          <p>
            Eat well every day without thinking about it. Our 5-day and 20-day
            prepaid plans deliver a fresh classic veg tiffin every weekday —
            the easiest (and tastiest) way to do lunch.
          </p>
          <a href="#menu" className="btn">
            See Plans
          </a>
        </div>
      </section>

      <Footer />

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
