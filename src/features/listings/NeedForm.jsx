import { Search } from 'lucide-react';
import { useState } from 'react';
import SkillField from './SkillField.jsx';
import Header from '../../shared/ui/Header.jsx';
import { categories } from '../../shared/lib/matching.js';
import { apiCategories } from '../../shared/lib/categories.js';
export default function NeedForm({ onBack, onSubmit, busy, apiMode, initial }) {
  const [pricingBasis, setPricingBasis] = useState(initial?.pricingBasis || 'fixed');
  return (
    <>
      <Header title={initial ? 'Edit Help Request' : 'Request Local Help'} back={onBack} />
      <div className="progress">
        <i />
        <i />
        <i />
      </div>
      <h1 className="form-title">Describe what you need</h1>
      <p className="muted">Neighbors will send offers based on your post.</p>
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          onSubmit({
            ...d,
            budget: Number(d.budget),
            hours: Number(d.hours),
            radius: Number(d.radius),
            tools: d.tools === 'on',
          });
        }}
      >
        <label>
          Short Title
          <input
            name="title"
            required
            maxLength={100}
            placeholder="Raised bed garden setup & soil prep" defaultValue={initial?.title || ''}
          />
        </label>
        <label>
          Category
          <select name="category" defaultValue={initial?.category}>
            {(apiMode ? apiCategories : categories).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <SkillField apiMode={apiMode} value={initial?.skills?.[0]} />
        <label>
          Details & Materials
          <textarea
            name="description"
            required
            maxLength={2000}
            placeholder="Tell your neighbor about the task, materials, and anything they should bring." defaultValue={initial?.description || ''}
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
              Est. Budget (NZD)
              <input
                name="budget"
                type="number"
                min="1"
                max="100000"
                required
                defaultValue={initial?.budget ?? initial?.budgetMax ?? 150}
              />
            </label>
          )}
          {(!apiMode || pricingBasis === 'hourly') && (
            <label>
              Estimated Hours
              <input
                name="hours"
                type="number"
                min="0.5"
                max="1000"
                step="0.5"
                required
                defaultValue={initial?.estimatedHours ?? 3}
              />
            </label>
          )}
          <label>
            Timeframe
            <select name="timeframe">
              <option>This Weekend</option>
              <option>Today</option>
              <option>Flexible</option>
            </select>
          </label>
          <label>
            Search Radius (miles)
            <input
              name="radius"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              required
              defaultValue="3"
            />
          </label>
        </div>
        <label className="checkbox">
          <input name="tools" type="checkbox" defaultChecked />
          Helper should bring tools
        </label>
        {apiMode && (
          <label>
            Deadline (optional)
            <input type="datetime-local" name="deadline" defaultValue={initial?.deadline ? initial.deadline.slice(0, 16) : ''} />
          </label>
        )}
        <div className="sticky-action">
          <button className="primary" disabled={busy}>
            {busy ? 'Saving…' : initial ? 'Save Help Request' : 'Post Help Request'}
          </button>
        </div>
      </form>
    </>
  );
}
