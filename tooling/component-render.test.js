import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('application composition and feature screens render with injected data', async () => {
  const server = await createServer({
    configLoader: 'native',
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
  });
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx');
    assert.match(renderToStaticMarkup(React.createElement(App)), /Connecto/);
    const { default: AppShell } = await server.ssrLoadModule('/src/app/AppShell.jsx');
    const noop = () => {};
    const offering = {
      id: 'demo',
      title: 'Garden help',
      name: 'Example member',
      category: 'Garden',
      rate: 25,
      distance: 1,
      rating: 4,
      reviews: 1,
      reasons: [],
    };
    const model = {
      profile: { name: 'Example member', neighborhood: 'Auckland', bio: '' },
      signedIn: false,
      offers: [offering],
      needs: [],
      messages: {},
      category: 'Garden',
      query: '',
      selected: offering,
      activeNeed: null,
      filterToday: false,
      busy: false,
      apiError: '',
      apiMode: false,
      results: [],
      filtered: [offering],
      navVisible: true,
      modal: false,
      notice: '',
      ...Object.fromEntries(
        [
          'login',
          'register',
          'confirm',
          'resend',
          'logout',
          'previewProfile',
          'saveProfile',
          'refreshActivity',
          'setMessages',
          'setCategory',
          'setQuery',
          'setSelected',
          'setModal',
          'setFilterToday',
          'setApiMode',
          'publishNeed',
          'publishOffering',
          'navigate',
          'openOffer',
          'showMatches',
          'setNotice',
        ].map((name) => [name, noop]),
      ),
    };
    for (const page of [
      'welcome',
      'register',
      'login',
      'discover',
      'helpers',
      'matches',
      'detail',
      'need',
      'offer',
      'profile',
      'gigs',
      'inbox',
      'chat',
    ]) {
      const html = renderToStaticMarkup(
        React.createElement(AppShell, { model: { ...model, page } }),
      );
      assert.ok(html.includes('workspace'), `${page} must render its shell`);
      assert.ok(html.length > 500, `${page} must render content`);
    }
    const html = renderToStaticMarkup(
      React.createElement(AppShell, {
        model: {
          ...model,
          page: 'profile',
          modal: true,
          busy: true,
          apiError: 'Offline',
          notice: 'Saved',
        },
      }),
    );
    assert.match(html, /role="alert"/);
    assert.match(html, /Offline/);
    assert.match(html, /Saved/);
    assert.match(html, /role="dialog"/);
    const { ProfilePage, ProfileDialog } = await server.ssrLoadModule(
      '/src/features/members/index.js',
    );
    const emptyProfileHtml = renderToStaticMarkup(
      React.createElement(ProfilePage, {
        profile: { firstName: '', name: '', neighborhood: '', bio: '' },
        signedIn: true,
        apiMode: true,
        onLogout: noop,
        setModal: noop,
        navigate: noop,
      }),
    );
    assert.doesNotMatch(emptyProfileHtml, /Clara Miller|Sunset Valley|friendly face/);
    assert.match(emptyProfileHtml, /Neighborhood not set/);
    const profileFormHtml = renderToStaticMarkup(
      React.createElement(ProfileDialog, {
        profile: {
          firstName: 'Mary Jane',
          lastName: 'van der Berg',
          neighborhood: '',
          bio: '',
        },
        signedIn: true,
        busy: true,
        error: 'Profile could not be saved.',
        saveProfile: noop,
        setModal: noop,
      }),
    );
    assert.match(profileFormHtml, /name="firstName"/);
    assert.match(profileFormHtml, /value="Mary Jane"/);
    assert.match(profileFormHtml, /value="van der Berg"/);
    assert.match(profileFormHtml, /<fieldset[^>]*disabled/);
    assert.match(profileFormHtml, /role="alert">Profile could not be saved/);
    assert.doesNotMatch(profileFormHtml, /Sunset Valley/);
  } finally {
    await server.close();
  }
});
