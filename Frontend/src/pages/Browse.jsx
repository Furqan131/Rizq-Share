import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import ClaimModal from '../components/ClaimModal.jsx';
import FoodCard from '../components/FoodCard.jsx';
import { EmptyState, SkeletonGrid } from '../components/ui.jsx';
import { useDonate } from '../hooks/useDonate.js';

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar'];

export default function Browse() {
  const donate = useDonate();
  const [cityInput, setCityInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [applied, setApplied] = useState({ city: '', area: '' });
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(null);

  // silent = background refresh: no loading skeleton, errors are ignored
  const fetchPosts = useCallback(async (silent) => {
    if (!silent) {
      setPosts(null);
      setError('');
    }
    try {
      const q = new URLSearchParams();
      if (applied.city) q.set('city', applied.city);
      if (applied.area) q.set('area', applied.area);
      setPosts(await api('/posts?' + q.toString()));
    } catch (err) {
      if (!silent) setError(err.message);
    }
  }, [applied]);

  // Load, then pick up new posts from other donors every 45 seconds
  useEffect(() => {
    fetchPosts(false);
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchPosts(true);
    }, 45000);
    return () => clearInterval(id);
  }, [fetchPosts]);

  const search = (e) => {
    e.preventDefault();
    setApplied({ city: cityInput.trim(), area: areaInput.trim() });
  };

  const pickCity = (city) => {
    const next = applied.city.toLowerCase() === city.toLowerCase() ? '' : city;
    setCityInput(next);
    setApplied({ city: next, area: areaInput.trim() });
  };

  const clear = () => {
    setCityInput('');
    setAreaInput('');
    setApplied({ city: '', area: '' });
  };

  return (
    <>
      <header className="page-head">
        <div className="container">
          <h1>Browse food</h1>
          <p>Fresh food shared near you. New posts show up here automatically.</p>
        </div>
      </header>

      <main className="container section">
        <div className="filters-bar">
          <form className="filters" onSubmit={search}>
            <input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="City, for example Karachi" aria-label="City" />
            <input value={areaInput} onChange={(e) => setAreaInput(e.target.value)} placeholder="Area, for example Gulshan" aria-label="Area" />
            <button className="btn btn-primary" type="submit">Search</button>
            <button className="btn btn-ghost" type="button" onClick={clear}>Clear</button>
          </form>
          <div className="chips">
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                className={'chip-btn' + (applied.city.toLowerCase() === c.toLowerCase() ? ' on' : '')}
                onClick={() => pickCity(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {posts && (
          <p className="muted" aria-live="polite" style={{ margin: '0 0 14px' }}>
            {posts.length === 1 ? '1 post available' : `${posts.length} posts available`}
          </p>
        )}

        {error ? (
          <EmptyState title="Couldn't load food posts" text={error}>
            <button className="btn btn-primary" onClick={() => fetchPosts(false)}>Try again</button>
          </EmptyState>
        ) : !posts ? (
          <SkeletonGrid />
        ) : posts.length === 0 ? (
          <EmptyState title="No food available here yet" text="Try another city or area, or check back soon. Got extra food yourself?">
            <button className="btn btn-primary" onClick={donate}>Donate now</button>
          </EmptyState>
        ) : (
          <div className="grid">
            {posts.map((p) => <FoodCard key={p.id} post={p} onClaim={setClaiming} />)}
          </div>
        )}
      </main>


      {claiming && (
        <ClaimModal post={claiming} onClose={() => setClaiming(null)} onDone={() => fetchPosts(true)} />
      )}
    </>
  );
}
