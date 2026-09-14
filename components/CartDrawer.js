const money = (n) => `$${Number(n).toFixed(2)}`;

export default function CartDrawer({
  cartItems,
  cartCount,
  cartTotal,
  onSetQty,
  onClose,
  onCheckout,
}) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <header>
          <h3>Your Cart ({cartCount})</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="items">
          {cartItems.length === 0 && (
            <div className="empty-cart">Your cart is empty.</div>
          )}
          {cartItems.map((cartItem) => (
            <div className="cart-item" key={cartItem.item.id}>
              <div>
                <div className="name">{cartItem.item.name}</div>
                <div className="unit">{money(cartItem.item.price)} each</div>
              </div>
              <div className="qty-controls">
                <button onClick={() => onSetQty(cartItem.item.id, cartItem.qty - 1)}>
                  −
                </button>
                <span>{cartItem.qty}</span>
                <button onClick={() => onSetQty(cartItem.item.id, cartItem.qty + 1)}>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        {cartItems.length > 0 && (
          <footer>
            <div className="total-row">
              <span>Total</span>
              <span>{money(cartTotal)}</span>
            </div>
            <button className="btn" style={{ width: "100%" }} onClick={onCheckout}>
              Checkout
            </button>
          </footer>
        )}
      </div>
    </>
  );
}
