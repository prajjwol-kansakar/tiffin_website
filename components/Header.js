"use client";

export default function Header({ cartCount, onCart, showBackHome = false }) {
  return (
    <header className="site-header">
      <a className="brand" href="/">
       AUTHENTIC TAKE
      </a>
      <div className="menu-header-actions">
        <button className="cart-btn" onClick={onCart}>
          🛒 Cart{cartCount > 0 ? ` (${cartCount})` : ""}
        </button>
        {showBackHome && (
          <a className="btn" href="/">
            Back home
          </a>
        )}
      </div>
    </header>
  );
}
