"use client";

import { useState } from "react";

export default function LoginModal({ onSuccess, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submitLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error || "Sign-in failed. Please try again.");
        return;
      }

      onSuccess();
    } catch {
      setError("Could not reach the login service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-modal-overlay">
      <section
        className="login-card login-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-login-title"
      >
        <button
          className="close-btn login-modal-close"
          type="button"
          aria-label="Close sign-in"
          onClick={onClose}
          disabled={submitting}
        >
          ✕
        </button>
        <h1 id="checkout-login-title">Sign in to continue</h1>
        <p>Sign in to proceed to checkout.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="checkout-form" onSubmit={submitLogin}>
          <label htmlFor="checkout-login-username">Username</label>
          <input
            id="checkout-login-username"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="checkout-login-password">Password</label>
          <input
            id="checkout-login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}
