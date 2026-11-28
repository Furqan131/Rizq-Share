import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CountdownRing from './CountdownRing.jsx';
import { PinIcon, UserIcon } from './icons.jsx';

export default function FoodCard({ post, onClaim }) {
  const { user } = useAuth();

  let action;
  if (!user) {
    action = <Link className="btn btn-ghost btn-block" to="/auth">Log in to claim</Link>;
  } else if (post.donorId === user.id) {
    action = <p className="own-note">This is your post. Manage it from your dashboard.</p>;
  } else {
    action = (
      <button className="btn btn-primary btn-block" onClick={() => onClaim(post)}>
        Claim this food
      </button>
    );
  }

  return (
    <article className="card">
      {post.imageUrl && <img className="card-img" src={post.imageUrl} alt={post.title} loading="lazy" />}
      <div className="card-top">
        <div>
          <h3>{post.title}</h3>
          <span className="pill">{post.quantity}</span>
        </div>
        <CountdownRing createdAt={post.createdAt} expiresAt={post.expiresAt} />
      </div>
      {post.description && <p className="desc">{post.description}</p>}
      <p className="meta"><PinIcon /><span>{post.area}, {post.city}</span></p>
      <p className="meta"><UserIcon /><span>Shared by {post.donor.name}</span></p>
      <div className="spacer" />
      {action}
    </article>
  );
}
