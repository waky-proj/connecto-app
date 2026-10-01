import { ArrowLeft } from 'lucide-react';
export default function Header({ title, back, right }) {
  return (
    <header className="page-header">
      {back && (
        <button aria-label="Go back" onClick={back}>
          <ArrowLeft size={21} />
        </button>
      )}
      <h1>{title}</h1>
      {right}
    </header>
  );
}
