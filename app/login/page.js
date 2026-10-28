"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
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

      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      const destination =
        returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
          ? returnTo
          : "/menu?resumeCheckout=1";
      window.location.assign(destination);
    } catch {
      setError("Could not reach the login service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <a className="login-page-close" href="/menu" aria-label="Close sign-in">
          ×
        </a>
        <h1>Sign in to place your order</h1>
        <p>Your cart will be ready when you return.</p>
        {error && <div className="form-error">{error}</div>}
        <form className="checkout-form" onSubmit={onSubmit}>
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
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
        <a className="login-back" href="/menu">
          Back to menu
        </a>
      </section>
    </main>
  );
}
