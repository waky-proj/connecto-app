export function normalizeMatches(matches, offers, need) {
  if (!Array.isArray(matches)) throw new Error('The API returned an invalid match list.');
  return matches
    .map((match) => {
      const known =
        match.offering ||
        offers.find((offer) => offer.id === match.offeringId && offer.source === 'api');
      const breakdown = typeof match.score === 'object' ? match.score : match.breakdown;
      const score = typeof match.score === 'number' ? match.score : match.score?.total;
      if (!match.offeringId || !Number.isFinite(score))
        throw new Error('The API returned an invalid match.');
      return {
        ...(known || {
          id: match.offeringId,
          title: 'Offering details unavailable',
          category: need.category,
        }),
        id: match.offeringId,
        name: known?.providerName || known?.name || 'Member',
        rate: known?.priceMax ?? known?.priceMin ?? known?.rate ?? null,
        distance: null,
        rating: null,
        reviews: null,
        emoji: '🤝',
        source: 'api',
        score,
        breakdown,
        reasons: match.reasons || [],
        unknowns: match.unknowns || [],
        policyVersion: match.policyVersion,
      };
    })
    .sort((a, b) => b.score - a.score);
}
