import { Search } from 'lucide-react';
export default function SearchBox({ query, setQuery }) {
  return (
    <div className="search-box">
      <Search size={17} />
      <input
        aria-label="Search skills or neighbors"
        placeholder="Search skills, tools, or requests…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
