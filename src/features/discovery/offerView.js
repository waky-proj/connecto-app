export function mapDiscoveryOffer(offer) {
  if (!offer?.id || !offer?.title) throw new Error('Invalid offering returned by discovery.');
  return {
    ...offer,
    source: 'api',
    name: offer.providerName || 'Member',
    rate: offer.priceMax ?? offer.priceMin ?? null,
    distance: null,
    rating: null,
    reviews: null,
    emoji: '🤝',
  };
}
