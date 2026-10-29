"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LoginModal from "@/components/LoginModal";
import MenuCard from "@/components/MenuCard";
import MenuFetcher from "@/components/MenuFetcher";
import OrderConfirmationModal from "@/components/OrderConfirmationModal";
import { createOrderPayload } from "@/lib/createOrderPayload";
import { hasValidPhoneNumber } from "@/lib/phoneNumber";
import chefPhoto from "../images/SUN_0951.jpg";

export default function HomePage() {
  const [menu, setMenu] = useState([]);
  const [menuSource, setMenuSource] = useState(null);
  const [menuError, setMenuError] = useState(null);
  const [menuHasMore, setMenuHasMore] = useState(false);
  const [cart, setCart] = useState({}); // id -> { item, qty }
  const [cartLoaded, setCartLoaded] = useState(false);
  const menuLoadFailed = useRef(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", deliveryDate: "" });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingCheckout, setCheckingCheckout] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // { orderId, stored }
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false);

  const handleMenuLoaded = useCallback((data) => {
    setMenu(data.items || []);
    setMenuSource(data.source || null);
    setMenuHasMore(Boolean(data.hasMore));
    setMenuError(null);
  }, []);
  const handleMenuLoadFailure = useCallback(() => {
    menuLoadFailed.current = true;
    setMenuError("Could not load the menu.");
    setCart({});
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    try {
      if (!menuLoadFailed.current) {
        const savedCart = window.localStorage.getItem("tiffin-cart");
        if (savedCart) setCart(JSON.parse(savedCart));
      }
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
      const savedForm = window.sessionStorage.getItem("tiffin-checkout-form");
      if (savedForm) {
        try {
          const parsedForm = JSON.parse(savedForm);
          if (
            parsedForm &&
            typeof parsedForm.name === "string" &&
            typeof parsedForm.phone === "string" &&
            typeof parsedForm.address === "string" &&
            typeof parsedForm.deliveryDate === "string"
          ) {
            setForm(parsedForm);
          }
        } catch {
          setFormError("Your saved checkout details could not be restored.");
        }
        window.sessionStorage.removeItem("tiffin-checkout-form");
      }
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

  const openCheckout = async () => {
    setFormError(null);
    setCheckingCheckout(true);
    try {
      const sessionResponse = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      const session = await sessionResponse.json();
      if (!session.authenticated) {
        setLoginOpen(true);
        return;
      }

      setCheckoutOpen(true);
      setCartOpen(false);
    } catch {
      setFormError("Could not verify your sign-in. Please try again.");
    } finally {
      setCheckingCheckout(false);
    }
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setFormError("Please fill in your name, phone and delivery address.");
      return;
    }

    if (!hasValidPhoneNumber(form.phone)) {
      setFormError("Please enter a valid 10-digit phone number.");
      return;
    }

    setOrderConfirmationOpen(true);
  };

  const confirmOrder = async () => {
    if (!hasValidPhoneNumber(form.phone)) {
      setOrderConfirmationOpen(false);
      setFormError("Please enter a valid 10-digit phone number.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createOrderPayload(form, cartItems)),
      });
      const responseText = await res.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }
      if (res.status === 401) {
        setOrderConfirmationOpen(false);
        setLoginOpen(true);
        return;
      }
      if (res.ok && data.ok !== false && data.success !== false) {
        setOrderConfirmationOpen(false);
        setConfirmed({
          orderId: data.orderId ?? data.id ?? null,
          name: form.name.trim(),
        });
        setCart({});
        setCheckoutOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setFormError(
          data.error || data.message || "Something went wrong placing your order."
        );
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
        <MenuFetcher
          url="/api/product?pageNumber=1&pageSize=10&searchTerms=%25"
          onSuccess={handleMenuLoaded}
          onFailure={handleMenuLoadFailure}
        />
        <Header cartCount={0} onCart={() => {}} />
        <main className="confirmation">
          <div className="check">✓</div>
          <h2>Order received — thank you, {confirmed.name || "friend"}!</h2>
          <p>
            Your order is being packed with love. We&apos;ll call you shortly to
            confirm delivery.
          </p>
          {confirmed.orderId && (
            <div className="order-id">Order ID: {confirmed.orderId}</div>
          )}
          <p>Your order was sent to our kitchen team.</p>
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
      <MenuFetcher
        url="/api/product?pageNumber=1&pageSize=10&searchTerms=%25"
        onSuccess={handleMenuLoaded}
        onFailure={handleMenuLoadFailure}
      />
      <Header cartCount={cartCount} onCart={() => setCartOpen(true)} />

      <section className="hero">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1800&q=85"
          alt="Fresh home-style meal served in a bowl"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="kicker">Homemade Food</span>
          <h1 className="hero-title" aria-label="MADE THE WAY IT SHOULD BE">
            {"MADE     THE WAY IT SHOULD BE".split("").map((character, index) => (
              <span
                aria-hidden="true"
                className="hero-title-character"
                key={`${character}-${index}`}
                style={{ "--character-index": index }}
              >
                {character === " " ? "\u00a0" : character}
              </span>
            ))}
          </h1>
          <p>
           Fresh foods, made in small batches with real ingredients and delivered to your door.
          </p>
          <a href="#menu" className="btn">
           Explore Our Menu
          </a>
        </div>
      </section>

      <section className="section">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="num">1</div>
            <h3>Choose what you love</h3>
            <p>Browse from menu below.</p>
          </div>
          <div className="step">
            <div className="num">2</div>
            <h3>Place your order</h3>
            <p>Add to cart and check out with your delivery details.</p>
          </div>
          <div className="step">
            <div className="num">3</div>
            <h3>Enjoy it fresh</h3>
            <p>Arrive hot, frozen and ready to celebrate.</p>
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
              <MenuCard item={item} onAdd={addToCart} key={item.id} />
            ))}
          </div>
          {menuHasMore && (
            <div className="menu-more">
              <a href="/menu" className="btn secondary">
                Show more <span aria-hidden="true">→</span>
              </a>
            </div>
          )}
        </div>
      </section>

      <section id="about" className="section about-section">
        <div className="about-story">
          <div className="about-story-art" aria-hidden="true">
            <Image
              className="about-story-photo"
              src={chefPhoto}
              alt=""
              fill
              sizes="(max-width: 560px) 100vw, 35vw"
            />
            <span className="about-story-brand">Authentic Taste</span>
            <p>Made with care.<br />Shared like family.</p>
          </div>
          <div className="about-story-content">
            <span className="about-story-eyebrow">A little about us</span>
            <h2>Our Story</h2>
            <p>
              Authentic Taste began in a home kitchen with one belief: the best
              food is made with care, not factories. Whether it’s a weekday
              lunch, a plate of momos or an occasional cake, we cook the way we
              would for our own family.
            </p>
            <span className="about-story-accent" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="plans">
          <h2>Weekly &amp; Monthly Plans</h2>
          <p>
            Eat well every weekday without thinking about it. Choose our 5-day or 20-day prepaid plan and get a fresh classic veg tiffin at your door.
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
          checkoutLoading={checkingCheckout}
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
      {orderConfirmationOpen && (
        <OrderConfirmationModal
          submitting={submitting}
          error={formError}
          onConfirm={confirmOrder}
          onCancel={() => setOrderConfirmationOpen(false)}
        />
      )}
      {loginOpen && (
        <LoginModal
          onSuccess={() => {
            setLoginOpen(false);
            setCheckoutOpen(true);
            setCartOpen(false);
          }}
          onClose={() => setLoginOpen(false)}
        />
      )}
    </>
  );
}
