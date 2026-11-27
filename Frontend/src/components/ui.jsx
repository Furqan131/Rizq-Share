export function SkeletonGrid({ count = 3 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}

export function EmptyState({ title, text, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
