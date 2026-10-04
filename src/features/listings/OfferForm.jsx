import { Briefcase } from 'lucide-react';
import { useState } from 'react';
import SkillField from './SkillField.jsx';
import Header from '../../shared/ui/Header.jsx';
import { categories } from '../../shared/lib/matching.js';
import { apiCategories } from '../../shared/lib/categories.js';
export default function OfferForm({ onBack, onSubmit, busy, apiMode }) {
  const [pricingBasis, setPricingBasis] = useState('hourly');
  return (
    <>
      <Header title="Offer Your Skills" back={onBack} />
      <h1 className="form-title">List a local skill or resource</h1>
      <p className="muted">
        Set up what you do best and how neighbors can use your time.
      </p>
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          onSubmit({ ...d, rate: Number(d.rate), tools: d.tools === 'on' });
        }}
      >
        <label>
          Skill / Service Name
          <input
            name="title"
            required
            maxLength={100}
            placeholder="Bicycle Tuning & Chain Maintenance"
          />
        </label>
        <label>
          Category
          <select name="category">
            {(apiMode ? apiCategories : categories).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <SkillField apiMode={apiMode} />
        <label>
          About your offering
          <textarea
            name="description"
            required
            maxLength={2000}
            placeholder="Describe your skills and experience."
          />
        </label>
        <div className="form-grid">
          {apiMode && (
            <label>
              Pricing basis
              <select name="pricingBasis" value={pricingBasis} onChange={(event) => setPricingBasis(event.target.value)}>
                <option value="fixed">Fixed total (NZD)</option>
                <option value="hourly">Hourly (NZD)</option>
                <option value="free">Free</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </label>
          )}
          {(!apiMode || pricingBasis === 'fixed' || pricingBasis === 'hourly') && (
            <label>
              Your Rate (NZD)
              <input
                name="rate"
                type="number"
                required
                min="1"
                max="10000"
                defaultValue="30"
              />
            </label>
          )}
          <label>
            Availability
            <select name="availability">
              <option>This Weekend</option>
              <option>Today</option>
              <option>Flexible</option>
            </select>
          </label>
        </div>
        <label className="checkbox">
          <input name="tools" type="checkbox" defaultChecked />
          Yes, I bring my tools
        </label>
        {apiMode && (
          <>
            <label>
              Experience (years)
              <input
                name="experienceYears"
                type="number"
                min="0"
                max="100"
                defaultValue="0"
              />
            </label>
            <div className="form-grid">
              <label>
                Available From
                <input name="availableFrom" type="datetime-local" />
              </label>
              <label>
                Available Until
                <input name="availableUntil" type="datetime-local" />
              </label>
            </div>
          </>
        )}
        <div className="showcase">
          <Briefcase />
          <p>
            Your skill is the starting point.
            <br />
            Tell neighbors what makes it special.
          </p>
        </div>
        <div className="sticky-action">
          <button className="primary green-button" disabled={busy}>
            {busy ? 'Publishing…' : 'Publish Your Skill'}
          </button>
        </div>
      </form>
    </>
  );
}
