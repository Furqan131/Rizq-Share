import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ClaimModal from '../components/ClaimModal.jsx';
import CountdownRing from '../components/CountdownRing.jsx';
import FoodCard from '../components/FoodCard.jsx';
import { EmptyState, SkeletonGrid } from '../components/ui.jsx';
import { useCountUp } from '../hooks/useCountUp.js';
import { useDonate } from '../hooks/useDonate.js';

const STEPS = [
  ['Post your food', 'Add what you have, how many people it feeds, where to pick it up and when it expires.'],
  ['Someone claims it', 'Browse by city and area. Claim a post and the pickup details appear instantly.'],
  ['Food gets collected', 'The donor confirms the pickup, and the meal reaches someone who needs it.'],
];

const BENEFITS = [
  ['See how long it stays good', 'Every post has a live countdown, so you know exactly how much time is left to collect.'],
  ['Find food near you', 'Filter by city and area to find food you can actually reach in time.'],
  ['No double claims', 'Once someone claims a post, it is reserved for them, so nobody travels for food that is gone.'],
  ['Private until claimed', 'Pickup addresses and phone numbers are only shown to the person who claims the food.'],
];

const DONOR_TIPS = [
  'Post only food that is fresh and has been stored properly.',
  'Pack it in clean, covered containers.',
  'Set a realistic best-before time and be honest about the quantity.',
  'Mark the post as collected once it is picked up.',
];

const RECEIVER_TIPS = [
  'Claim only what you can pick up before the timer runs out.',
  'Bring your own containers if you can.',
  'Check the food yourself before eating or sharing it.',
  'Be kind and on time: someone prepared this for you.',
];

function Stat({ value, label }) {
  const shown = useCountUp(value);
  return (
    <div>
      <strong>{shown}</strong>
      <span>{label}</span>
    </div>
  );
}

function Spotlight({ post }) {
  if (!post) {
    return (
      <div className="spotlight">
        <h3>Nothing posted right now</h3>
        <p className="small">Have extra food? Be the first to share it today.</p>
      </div>
    );
  }
  return (
    <div className="spotlight">
      <span className="small">Expiring soonest</span>
      <h3>{post.title}</h3>
      <p className="small" style={{ margin: '0 0 16px' }}>
        {post.quantity} in {post.area}, {post.city}
      </p>
      <CountdownRing createdAt={post.createdAt} expiresAt={post.expiresAt} sub="left to collect" />
      <Link className="btn btn-primary btn-block" to="/browse">See all food</Link>
    </div>
  );
}

export default function Home() {
  const donate = useDonate();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ available: 0, collected: 0, members: 0 });
  const [claiming, setClaiming] = useState(null);

  const load = useCallback(async () => {
    api('/posts/stats').then(setStats).catch(() => {});
    try {
      setPosts(await api('/posts?limit=6'));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <header className="hero">
        <div className="container hero-grid">
          <div>
            <h1 className="rise">Good food shouldn't go to waste.</h1>
            <p className="lead rise">
              Weddings, restaurants and homes end the day with extra food. Post it here, and someone nearby collects it before it spoils.
            </p>
            <div className="hero-cta rise">
              <Link className="btn btn-accent" to="/browse">Find food near you</Link>
              <button className="btn btn-outline-light" onClick={donate}>Donate now</button>
            </div>
          </div>
          <div className="rise card-slot">
            {posts ? <Spotlight post={posts[0]} /> : null}
          </div>
        </div>
      </header>

      <section className="band" aria-label="Rizq Share in numbers">
        <div className="container band-grid">
          <Stat value={stats.available} label="Posts available now" />
          <Stat value={stats.collected} label="Posts collected so far" />
          <Stat value={stats.members} label="People in the community" />
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>Available now</h2>
          <Link className="more-link" to="/browse">See all food</Link>
        </div>
        {error ? (
          <EmptyState title="Couldn't load food posts" text={error}>
            <button className="btn btn-primary" onClick={load}>Try again</button>
          </EmptyState>
        ) : !posts ? (
          <SkeletonGrid />
        ) : posts.length === 0 ? (
          <EmptyState title="No food available right now" text="Be the first to share something today.">
            <button className="btn btn-primary" onClick={donate}>Donate now</button>
          </EmptyState>
        ) : (
          <div className="grid">
            {posts.map((p) => <FoodCard key={p.id} post={p} onClaim={setClaiming} />)}
          </div>
        )}
      </section>

      <section className="section container" style={{ paddingTop: 8 }}>
        <div className="section-head"><h2>How it works</h2></div>
        <div className="steps">
          {STEPS.map(([title, text], i) => (
            <div className="step" key={title}>
              <b>{i + 1}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 8 }}>
        <div className="section-head"><h2>Why Rizq Share</h2></div>
        <div className="cards-4">
          {BENEFITS.map(([title, text]) => (
            <div className="info-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 8 }}>
        <div className="section-head"><h2>Sharing food safely</h2></div>
        <div className="tips-grid">
          <div className="tip-card">
            <h3>If you're donating</h3>
            <ul>{DONOR_TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="tip-card">
            <h3>If you're collecting</h3>
            <ul>{RECEIVER_TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 8 }}>
        <div className="cta-band">
          <h2>Got extra food today? Someone nearby can use it.</h2>
          <div className="hero-cta">
            <button className="btn btn-accent" onClick={donate}>Donate now</button>
            <Link className="btn btn-outline-light" to="/browse">Browse food</Link>
          </div>
        </div>
      </section>


      {claiming && (
        <ClaimModal post={claiming} onClose={() => setClaiming(null)} onDone={load} />
      )}
    </>
  );
}
