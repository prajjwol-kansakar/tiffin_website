export default function OrderConfirmationModal({
  submitting,
  error,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="order-confirmation-overlay">
      <section
        className="order-confirmation-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-confirmation-title"
        aria-describedby="order-confirmation-message"
      >
        <h2 id="order-confirmation-title">Place your order?</h2>
        <p id="order-confirmation-message">
          Are you sure you want to place this order? It will be sent to our
          kitchen.
        </p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="order-confirmation-actions">
          <button
            className="btn secondary"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            No
          </button>
          <button
            className="btn"
            type="button"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? "Placing order…" : "Yes"}
          </button>
        </div>
      </section>
    </div>
  );
}
