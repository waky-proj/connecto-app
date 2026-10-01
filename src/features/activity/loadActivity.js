// Return data only; the application owns committing it to the current session.
export async function loadMemberActivity(api, member, isCurrent) {
  let page = 1;
  const needs = [],
    offers = [];
  while (isCurrent()) {
    const data = await api.getActivity(page);
    if (!isCurrent()) return null;
    needs.push(...data.needs.map((n) => ({ ...n, source: 'api', budget: n.budgetMax })));
    offers.push(
      ...data.offerings.map((o) => ({
        ...o,
        source: 'api',
        name: member.name || 'You',
        rate: o.priceMax,
        distance: null,
        rating: null,
        reviews: null,
        emoji: '🤝',
      })),
    );
    if (page * data.pageSize >= Math.max(data.needTotal, data.offeringTotal))
      return { needs, offers };
    page++;
  }
  return null;
}
