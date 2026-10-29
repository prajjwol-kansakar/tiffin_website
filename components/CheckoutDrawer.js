import { formatPhoneNumber } from "@/lib/phoneNumber";

const money = (n) => `$${Number(n).toFixed(2)}`;

export default function CheckoutDrawer({
  cartItems,
  cartTotal,
  form,
  formError,
  submitting,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <header>
          <h3>Checkout</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="items">
          <div className="demo-banner">
            <strong>No online payment is taken.</strong>
            <br />
            Fill in your details to checkout and send your order to our kitchen.
          </div>
          <div className="order-summary">
            <h3>Order Summary</h3>
            {cartItems.map((cartItem) => (
              <div className="summary-row" key={cartItem.item.id}>
                <span>{cartItem.qty} × {cartItem.item.name}</span>
                <span>{money(cartItem.qty * cartItem.item.price)}</span>
              </div>
            ))}
            <div className="summary-total">
              <span>Total</span>
              <span>{money(cartTotal)}</span>
            </div>
          </div>
          {formError && <div className="form-error">{formError}</div>}
          <form className="checkout-form" onSubmit={onSubmit}>
            <label htmlFor="checkout-name">Full name</label>
            <input
              id="checkout-name"
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Full Name"
            />
            <label htmlFor="checkout-phone">Phone</label>
            <input
              id="checkout-phone"
              type="tel"
              inputMode="numeric"
              maxLength={14}
              value={form.phone}
              onChange={(event) =>
                onChange("phone", formatPhoneNumber(event.target.value))
              }
              placeholder="e.g. (555) 123-4567"
            />
            <label htmlFor="checkout-address">Delivery address</label>
            <textarea
              id="checkout-address"
              rows={3}
              value={form.address}
              onChange={(event) => onChange("address", event.target.value)}
              placeholder="Street, apartment, city"
            />
            <label htmlFor="checkout-delivery-date">Delivery date</label>
            <input
              id="checkout-delivery-date"
              type="date"
              value={form.deliveryDate}
              onChange={(event) => onChange("deliveryDate", event.target.value)}
            />
            <div style={{ marginTop: "1.25rem" }}>
              <button className="btn" style={{ width: "100%" }} type="submit" disabled={submitting}>
                {submitting ? "Placing order…" : "Place Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
