import { MapPin, Star } from 'lucide-react';
export default function OfferCard({ offer: o, onClick, rank }) {
  const price = o.source === 'api'
    ? o.pricingBasis === 'free' || o.pricingBasis === 3 ? 'Free'
      : o.pricingBasis === 'negotiable' || o.pricingBasis === 4 ? 'Negotiable'
        : o.rate == null ? 'Price unavailable' : `NZ$${o.rate}${o.pricingBasis === 'hourly' || o.pricingBasis === 2 ? '/hr' : ' total'}`
    : o.rate == null ? 'Rate unavailable' : `${o.rate}/hr`;
  return (
    <button className="offer-card" onClick={onClick}>
      <div className={`offer-art art-${o.category.replaceAll(' ', '').toLowerCase()}`}>
        {o.emoji}
      </div>
      <div className="offer-info">
        <b>{o.name || 'Member'}</b>
        <p>{o.title}</p>
        <span className="rating">
          {o.source !== 'api' && <Star size={12} fill="currentColor" />}
          {o.source === 'api' ? 'Published offering' : o.reviews ? `${o.rating} (${o.reviews} reviews)` : 'New neighbor'}
        </span>
      </div>
      <div className="offer-meta">
        <b>{price}</b>
        {rank && (
          <strong>
            #{rank} · {o.score}%
          </strong>
        )}
        <small>
          <MapPin size={11} />
          {o.source === 'api' ? o.location || (o.remoteAvailable ? 'Remote available' : 'Location unknown') : o.distance == null ? 'Location unavailable' : `${o.distance} miles away`}
        </small>
      </div>
    </button>
  );
}
