import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Linter } from 'eslint';
import config from '../eslint.config.js';

const linter = new Linter();
const lint = (code, filename = 'src/features/listings/Example.jsx') =>
  linter.verify(code, config, { filename });
test('UI cannot import infrastructure, including re-exports and dynamic imports', () => {
  for (const code of [
    "import { createApiClient } from '../../services/api.js'; void createApiClient;",
    "export { createApiClient } from '../../services/api.js';",
    "export * from '../../services/api.js';",
    "import('../../services/api.js');",
  ])
    assert.ok(lint(code).some((m) => m.ruleId === 'connecto/component-boundaries'));
});
test('shared UI cannot import a feature and composition must use feature public interfaces', () => {
  assert.ok(
    lint(
      "export * from '../../features/members/index.js';",
      'src/shared/ui/Example.jsx',
    ).some((m) => m.ruleId === 'connecto/component-boundaries'),
  );
  assert.ok(
    lint(
      "import Page from '../features/members/ProfilePage.jsx'; void Page;",
      'src/app/Example.jsx',
    ).some((m) => m.ruleId === 'connecto/component-boundaries'),
  );
  assert.ok(
    lint("import Page from '../members/ProfilePage.jsx'; void Page;").some(
      (m) => m.ruleId === 'connecto/component-boundaries',
    ),
  );
});
test('feature public interfaces, local components and shared UI are allowed', () => {
  for (const code of [
    "import { mapProfile } from '../members/index.js'; void mapProfile;",
    "import Field from './SkillField.jsx'; void Field;",
    "import Header from '../../shared/ui/Header.jsx'; void Header;",
  ])
    assert.deepEqual(lint(code), []);
});
test('transport and browser persistence cannot be added directly to UI', () => {
  for (const code of [
    "fetch('/api/users/me');",
    "window.fetch('/api/users/me');",
    "localStorage.getItem('token');",
    "window.sessionStorage.getItem('profile');",
  ])
    assert.ok(
      lint(code).some((m) =>
        ['no-restricted-globals', 'no-restricted-syntax'].includes(m.ruleId),
      ),
    );
});
