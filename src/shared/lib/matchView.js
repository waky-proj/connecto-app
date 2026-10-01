export function normalizeMatches(matches, offers, need) {
  if (!Array.isArray(matches)) throw new Error('The API returned an invalid match list.');
  return matches
    .map((match) => {
      const known = offers.find(
        (offer) => offer.id === match.offeringId && offer.source === 'api',
      );
      const breakdown = typeof match.score === 'object' ? match.score : match.breakdown;
      const score = typeof match.score === 'number' ? match.score : match.score?.total;
      if (!match.offeringId || !Number.isFinite(score))
        throw new Error('The API returned an invalid match.');
      return {
        ...(known || {
          id: match.offeringId,
          name: 'Matched offering',
          title: `Offering ${match.offeringId.slice(0, 8)}`,
          category: need.category,
          description:
            'The API returned a match ID and explanations. Offering details are not yet available from the backend.',
          rate: null,
          distance: null,
          tools: null,
          rating: 0,
          reviews: 0,
          emoji: '🤝',
        }),
        source: 'api',
        score,
        breakdown,
        reasons: match.reasons || [],
      };
    })
    .sort((a, b) => b.score - a.score);
}
