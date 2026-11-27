import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <>
      <main className="container section" style={{ textAlign: 'center' }}>
        <h2>This page doesn't exist</h2>
        <p className="muted">The link may be broken, or the page may have moved.</p>
        <Link className="btn btn-primary" to="/">Back to home</Link>
      </main>
    </>
  );
}
