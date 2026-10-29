"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import CheckoutDrawer from "@/components/CheckoutDrawer";
import Header from "@/components/Header";
import LoginModal from "@/components/LoginModal";
import MenuCard from "@/components/MenuCard";
import MenuFetcher from "@/components/MenuFetcher";
import OrderConfirmationModal from "@/components/OrderConfirmationModal";
import { createOrderPayload } from "@/lib/createOrderPayload";
import { hasValidPhoneNumber } from "@/lib/phoneNumber";

const MENU_PAGE_SIZE = 4;

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [menuSource, setMenuSource] = useState(null);
  const [menuError, setMenuError] = useState(null);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerms, setSearchTerms] = useState("%");
  const searchChanged = useRef(false);
  const menuRequestId = useRef(0);
  const [cart, setCart] = useState({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const menuLoadFailed = useRef(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", deliveryDate: "" });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingCheckout, setCheckingCheckout] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false);

  const handleInitialMenuLoaded = useCallback((data) => {
    if (searchChanged.current) return;
    setMenu(data.items || []);
    setMenuSource(data.source || null);
    setHasMore(Boolean(data.hasMore));
    setMenuError(null);
  }, []);
  const handleInitialMenuFailure = useCallback(() => {
    menuLoadFailed.current = true;
    if (!searchChanged.current) {
      setMenuError("Could not load the menu.");
    }
    setCart({});
    setCartLoaded(true);
  }, []);
  const handleInitialMenuFinished = useCallback(() => {
    if (!searchChanged.current) setMenuLoading(false);
  }, []);
  useEffect(() => {
    if (!searchChanged.current) return;

    const requestId = ++menuRequestId.current;
    const timeoutId = window.setTimeout(async () => {
      const nextSearchTerms = searchInput.trim() || "%";
      const params = new URLSearchParams({
        pageNumber: "1",
        pageSize: String(MENU_PAGE_SIZE),
        searchTerms: nextSearchTerms,
      });

      setMenuLoading(true);
      setMenuError(null);
      setLoadMoreError(null);
      setSearchTerms(nextSearchTerms);
      setCurrentPage(1);
      setMenu([]);
      setHasMore(false);

      try {
        const response = await fetch(`/api/product?${params.toString()}`);
        const data = await response.json();
        if (requestId !== menuRequestId.current) return;
        if (!data.ok) throw new Error(data.error || "Could not search the menu.");

        setMenu(data.items || []);
        setMenuSource(data.source || null);
        setHasMore(Boolean(data.hasMore));
      } catch (error) {
        if (requestId === menuRequestId.current) {
          setMenuError(error.message || "Could not search the menu.");
        }
      } finally {
        if (requestId === menuRequestId.current) setMenuLoading(false);
      }
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const loadMoreMenu = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setLoadMoreError(null);
    const nextPage = currentPage + 1;
    const params = new URLSearchParams({
      pageNumber: String(nextPage),
      pageSize: String(MENU_PAGE_SIZE),
      searchTerms,
    });
    if (menuSource === "sample") params.set("source", "sample");

    try {
      const response = await fetch(`/api/product?${params.toString()}`);
      const data = await response.json();
      if (!data.ok) throw new Error("Could not load more menu items.");

      setMenu((items) => [...items, ...(data.items || [])]);
      setMenuSource(data.source || menuSource);
      setCurrentPage(nextPage);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setLoadMoreError("Could not load more menu items. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

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

  useEffect(() => {
    if (!cartLoaded) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("resumeCheckout") === "1") {
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
  }, [cartLoaded]);

  const submitOrder = async (event) => {
    event.preventDefault();
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
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createOrderPayload(form, cartItems)),
      });
      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }
      if (response.status === 401) {
        setOrderConfirmationOpen(false);
        setLoginOpen(true);
        return;
      }
      if (response.ok && data.ok !== false && data.success !== false) {
        setOrderConfirmationOpen(false);
        setConfirmed({
          orderId: data.orderId ?? data.id ?? null,
          name: form.name.trim(),
        });
        setCart({});
        setCheckoutOpen(false);
        setForm({ name: "", phone: "", address: "", deliveryDate: "" });
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
          url={`/api/product?pageNumber=1&pageSize=${MENU_PAGE_SIZE}&searchTerms=%25`}
          enabled={!searchChanged.current}
          onSuccess={handleInitialMenuLoaded}
          onFailure={handleInitialMenuFailure}
          onFinished={handleInitialMenuFinished}
        />
        <Header cartCount={0} onCart={() => {}} />
        <main className="confirmation">
          <div className="check">✓</div>
          <h2>Order received — thank you, {confirmed.name || "friend"}!</h2>
          <p>We&apos;ll call you shortly to confirm delivery.</p>
          {confirmed.orderId && (
            <div className="order-id">Order ID: {confirmed.orderId}</div>
          )}
          <p>Your order was sent to our kitchen team.</p>
          <button className="btn secondary" onClick={() => setConfirmed(null)}>
            Back to the menu
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <MenuFetcher
        url={`/api/product?pageNumber=1&pageSize=${MENU_PAGE_SIZE}&searchTerms=%25`}
        enabled={!searchChanged.current}
        onSuccess={handleInitialMenuLoaded}
        onFailure={handleInitialMenuFailure}
        onFinished={handleInitialMenuFinished}
      />
      <Header
        cartCount={cartCount}
        onCart={() => setCartOpen(true)}
        showBackHome
      />

      <main className="section menu-page">
        <div className="menu-page-heading">
          <h1>Our Menu</h1>
          <div className="menu-search" role="search">
            <label className="visually-hidden" htmlFor="menu-search-input">
              Search menu items
            </label>
            <input
              id="menu-search-input"
              type="search"
              value={searchInput}
              onChange={(event) => {
                searchChanged.current = true;
                setSearchInput(event.target.value);
              }}
              aria-label="Search menu items"
              placeholder="Search menu…"
            />
          </div>
        </div>
        {menuError && <div className="error-box">{menuError}</div>}
        {!menuError && menuLoading && (
          <div className="loading">Loading menu…</div>
        )}
        {!menuError && !menuLoading && menu.length === 0 && (
          <div className="loading">No menu items found.</div>
        )}
        <div className="menu-grid">
          {menu.map((item) => (
            <MenuCard item={item} onAdd={addToCart} key={item.id} />
          ))}
        </div>
        {loadMoreError && <div className="error-box">{loadMoreError}</div>}
        {hasMore && (
          <div className="menu-more">
            <button
              className="btn secondary"
              onClick={loadMoreMenu}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading…" : "Show more"}
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