const money = (n) => `$${Number(n).toFixed(2)}`;

export default function MenuCard({ item, onAdd }) {
  return (
    <article className="menu-card">
      {item.image && (
        <div className="menu-card-image-frame">
          <img
            className="menu-card-image"
            src={item.image}
            alt={item.name}
            loading="lazy"
          />
        </div>
      )}
      {item.tag && <span className="tag">{item.tag}</span>}
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <div className="row">
        <span className="price">{money(item.price)}</span>
        <button className="add-btn" onClick={() => onAdd(item)}>
          Add +
        </button>
      </div>
    </article>
  );
}
