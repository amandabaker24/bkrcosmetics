export default function LoadingDashboard() {
  return <section className="wrap admin-shell" aria-busy="true"><p role="status">Loading research dashboard…</p><div className="metrics" aria-hidden="true">{[1, 2, 3, 4].map(item => <div className="surface h-24 motion-safe:animate-pulse" key={item} />)}</div></section>;
}
