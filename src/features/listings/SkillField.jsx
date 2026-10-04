import { apiSkills } from '../../shared/lib/skills.js';
export default function SkillField({ apiMode, value }) {
  return (
    apiMode && (
      <>
        <label>
          Matching Skill
          <select name="skills" defaultValue={value || ''}>
            <option value="">No specific skill</option>
            {apiSkills.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <p className="muted">
          Only the skills listed here are currently supported by the backend. Hours,
          tools, radius, and the Today/Weekend preference remain local; use the date
          fields for API availability. Offering prices are sent as entered, since the API
          has no hourly-price field.
        </p>
      </>
    )
  );
}
