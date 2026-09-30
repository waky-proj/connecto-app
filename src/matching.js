export const categories = ['Garden', 'Home Help', 'Tech Guru', 'Lessons'];
export const initialOfferings = [
  {
    id: 'marcus',
    name: 'Marcus Thomson',
    title: 'Gardening & Landscapes',
    category: 'Garden',
    rate: 25,
    distance: 0.8,
    rating: 4.9,
    reviews: 42,
    tools: true,
    availability: 'This Weekend',
    description:
      'I’m happy to help you with soil turning, weeding, compost setup, and organic vegetable garden design. I have 10+ years of hobby gardening experience and my own shovels, rototiller, and pruning shears.',
    emoji: '🌿',
  },
  {
    id: 'clara',
    name: 'Clara S.',
    title: 'Organic Veggie Planting',
    category: 'Garden',
    rate: 30,
    distance: 1.2,
    rating: 4.8,
    reviews: 19,
    tools: true,
    availability: 'Today',
    description:
      'Let’s grow something good. I help neighbors plant seasonal vegetables and build healthy garden beds.',
    emoji: '🥕',
  },
  {
    id: 'jonathan',
    name: 'Jonathan D.',
    title: 'Lawn Mowing & Tool Lease',
    category: 'Garden',
    rate: 20,
    distance: 1.5,
    rating: 4.7,
    reviews: 54,
    tools: true,
    availability: 'This Weekend',
    description: 'Friendly lawn care and practical help with your outdoor projects.',
    emoji: '🌱',
  },
  {
    id: 'elena',
    name: 'Elena S.',
    title: 'Tech Setup & Repairs',
    category: 'Tech Guru',
    rate: 35,
    distance: 0.6,
    rating: 5,
    reviews: 18,
    tools: true,
    availability: 'Today',
    description:
      'Patient help with computers, Wi-Fi, and getting your devices connected.',
    emoji: '💻',
  },
  {
    id: 'sam',
    name: 'Sam Jenkins',
    title: 'Repairs & Painting',
    category: 'Home Help',
    rate: 28,
    distance: 1.1,
    rating: 4.8,
    reviews: 23,
    tools: true,
    availability: 'This Weekend',
    description:
      'Small home repairs, painting, and a helping hand with everyday projects.',
    emoji: '🛠️',
  },
  {
    id: 'lily',
    name: 'Lily Chen',
    title: 'Piano & Music Lessons',
    category: 'Lessons',
    rate: 32,
    distance: 0.9,
    rating: 4.9,
    reviews: 12,
    tools: false,
    availability: 'Flexible',
    description: 'Relaxed beginner music lessons for curious learners of all ages.',
    emoji: '🎹',
  },
];
export function rankMatches(need, offerings) {
  return offerings
    .filter((o) => o.category === need.category)
    .map((o) => {
      const budget = Number(need.budget),
        hours = Number(need.hours) || 1;
      const affordable = o.rate * hours <= budget;
      const available =
        o.availability === need.timeframe ||
        o.availability === 'Flexible' ||
        need.timeframe === 'Flexible';
      const nearby = o.distance <= Number(need.radius || 3);
      const equipped = !need.tools || o.tools;
      const score =
        40 +
        (affordable ? 20 : 0) +
        (available ? 15 : 0) +
        (nearby ? 10 : 0) +
        (equipped ? 10 : 0) +
        Math.round(o.rating);
      return {
        ...o,
        score,
        reasons: [
          `Offers ${need.category.toLowerCase()} help`,
          affordable
            ? `Estimated $${o.rate * hours} fits your $${budget} budget`
            : `Estimated $${o.rate * hours} exceeds your $${budget} budget`,
          available
            ? 'Availability aligns with your timeframe'
            : 'Availability needs confirming',
          nearby
            ? `${o.distance} miles away, within your search radius`
            : 'Outside your preferred radius',
          equipped ? 'Meets your tools preference' : 'Required tools are not included',
        ],
        estimatedCost: o.rate * hours,
      };
    })
    .sort((a, b) => b.score - a.score || a.distance - b.distance);
}
