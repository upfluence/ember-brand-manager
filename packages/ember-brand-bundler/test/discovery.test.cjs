'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { discoverBrandedPackageCandidates } = require('../dist/ember-cli/discovery.js');

const BRAND_METADATA_KEY = '@upfluence/ember-brand-manager/metadata';
const RUNTIME_PACKAGE_NAME = '@upfluence/ember-brand-manager';

test('discovers branded packages depth-first without revisiting shared or collecting unrelated addons', () => {
  const sharedAddon = addon('@upfluence/shared', undefined, '/shared-from-manifest');
  const runtimeAddon = addon(RUNTIME_PACKAGE_NAME, '/runtime');
  const firstAddon = addon('@upfluence/first', '/first', undefined, [runtimeAddon, sharedAddon]);
  const secondAddon = addon('@upfluence/second', '/second', undefined, [sharedAddon]);
  const unrelatedAddon = addon('@upfluence/unrelated', '/unrelated', undefined, [], false);
  const app = {
    project: {
      root: '/host',
      pkg: manifest('@upfluence/host'),
      addons: [firstAddon, unrelatedAddon, secondAddon]
    }
  };

  assert.deepEqual(
    discoverBrandedPackageCandidates(app).map(({ name, root, isAddon }) => ({ name, root, isAddon })),
    [
      { name: '@upfluence/host', root: '/host', isAddon: false },
      { name: '@upfluence/first', root: '/first', isAddon: true },
      { name: RUNTIME_PACKAGE_NAME, root: '/runtime', isAddon: true },
      { name: '@upfluence/shared', root: '/shared-from-manifest', isAddon: true },
      { name: '@upfluence/second', root: '/second', isAddon: true }
    ]
  );
});

function addon(name, root, manifestRoot, addons = [], branded = true) {
  return {
    root,
    pkg: manifest(name, manifestRoot, branded),
    addons
  };
}

function manifest(name, root, branded = true) {
  return branded
    ? { name, root, [BRAND_METADATA_KEY]: { assets: './brand-assets' } }
    : { name, root };
}
