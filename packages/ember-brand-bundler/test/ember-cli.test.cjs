'use strict';

const assert = require('node:assert/strict');
const { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const test = require('node:test');

const { MacrosConfig } = require('@embroider/macros/src/node');
const { withBrandAssets } = require('../dist/ember-cli/index.js');

const BRAND_METADATA_KEY = '@upfluence/ember-brand-manager/metadata';
const runtimeRoot = resolve(__dirname, '../../ember-brand-manager');
const runtimePackage = JSON.parse(readFileSync(resolve(runtimeRoot, 'package.json'), 'utf8'));

test('configures every branded package and returns the Ember application', (context) => {
  const hostPackage = temporaryPackage(context, '@upfluence/host', { isAddon: false });
  const firstPackage = temporaryPackage(context, '@upfluence/first');
  const secondPackage = temporaryPackage(context, '@upfluence/second');
  const unrelatedPackage = temporaryPackage(context, '@upfluence/unrelated', { branded: false });
  const app = fakeApplication(
    [
      addon({ root: runtimeRoot, pkg: runtimePackage }),
      addon(firstPackage),
      addon(unrelatedPackage),
      addon(secondPackage)
    ],
    hostPackage
  );
  const returnedApp = withBrandAssets(app, {
    brand: 'brand2',
    pageTitle: 'Brand Two',
    colorScheme: { '--brand-primary': '#111111' }
  });

  assert.equal(returnedApp, app);

  const contentAddon = app.project.addons.find(
    (registeredAddon) => registeredAddon.name === '@upfluence/ember-brand-bundler'
  );
  assert.ok(contentAddon);
  assert.equal(contentAddon.contentFor('page-title'), 'Brand Two');
  assert.equal(
    contentAddon.contentFor('head-footer'),
    '<style>:root { --brand-primary: #111111; }</style>'
  );

  const macrosConfig = MacrosConfig.for(app, resolve(app.project.configPath(), '..', '..'));
  macrosConfig.finalize();

  assert.deepEqual(macrosConfig.userConfigs[realpathSync(hostPackage.root)], { brand: 'brand2' });
  assert.deepEqual(macrosConfig.userConfigs[realpathSync(runtimeRoot)], { brand: 'brand2' });
  assert.deepEqual(macrosConfig.userConfigs[realpathSync(firstPackage.root)], { brand: 'brand2' });
  assert.deepEqual(macrosConfig.userConfigs[realpathSync(secondPackage.root)], { brand: 'brand2' });
  assert.equal(macrosConfig.userConfigs[realpathSync(unrelatedPackage.root)], undefined);
});

test('requires the runtime manager to declare branding metadata', (context) => {
  const hostPackage = temporaryPackage(context, '@upfluence/host', { isAddon: false });

  assert.throws(
    () => withBrandAssets(fakeApplication([], hostPackage)),
    /Could not find @upfluence\/ember-brand-manager among the branded packages/
  );
});

test('reports missing manifests for the affected branded package', (context) => {
  const missingManifestPackage = temporaryPackage(context, '@upfluence/missing-manifest', {
    writeManifest: false
  });

  assert.throws(
    () => withBrandAssets(fakeApplication([addon(missingManifestPackage)])),
    /Package manifest for @upfluence\/missing-manifest does not exist/
  );
});

test('reports package-specific macro configuration failures after the build is finalized', () => {
  const app = fakeApplication();
  const appRoot = resolve(app.project.configPath(), '..', '..');

  MacrosConfig.for(app, appRoot).finalize();

  assert.throws(
    () => withBrandAssets(app),
    /Unable to configure branded package @upfluence\/ember-brand-manager: .*after configs have been finalized/
  );
});

function fakeApplication(addons = [], projectPackage = { root: runtimeRoot, pkg: runtimePackage }) {
  return {
    project: {
      root: projectPackage.root,
      pkg: projectPackage.pkg,
      addons,
      configPath() {
        return projectPackage.root === runtimeRoot
          ? resolve(runtimeRoot, 'tests/dummy/config/environment')
          : resolve(projectPackage.root, 'config/environment');
      }
    },
    trees: {
      public: resolve(projectPackage.root, 'public')
    },
    toTree() {}
  };
}

function addon(packageFixture) {
  return {
    name: packageFixture.pkg.name,
    root: packageFixture.root,
    pkg: packageFixture.pkg,
    addons: []
  };
}

function temporaryPackage(context, name, options = {}) {
  const { branded = true, isAddon = true, writeManifest = true } = options;
  const root = mkdtempSync(join(tmpdir(), 'ember-brand-bundler-'));
  const pkg = {
    name,
    version: '1.0.0',
    keywords: isAddon ? ['ember-addon'] : [],
    ...(branded ? { [BRAND_METADATA_KEY]: { assets: './brand-assets' } } : {})
  };

  if (branded) mkdirSync(join(root, 'brand-assets', 'default', 'public'), { recursive: true });
  if (writeManifest) writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));

  context.after(() => rmSync(root, { recursive: true, force: true }));

  return { root, pkg };
}
