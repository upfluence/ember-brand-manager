'use strict';

const assert = require('node:assert/strict');
const { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const test = require('node:test');

const {
  buildColorSchemeStyle,
  createAssetLayers,
  resolveBrandOptions,
  resolveBrandedPackages
} = require('../dist/core/index.js');

test('resolves explicit options before environment defaults', () => {
  assert.deepEqual(
    resolveBrandOptions(
      { brand: 'brand2', pageTitle: 'Brand Two', debug: false },
      { BRAND: 'environment-brand', BRAND_PAGE_TITLE: 'Environment title', EBM_DEBUG: 'true' }
    ),
    {
      brand: 'brand2',
      pageTitle: 'Brand Two',
      colorScheme: undefined,
      debug: false
    }
  );

  assert.deepEqual(resolveBrandOptions(undefined, {}), {
    brand: 'default',
    pageTitle: 'Upfluence Software',
    colorScheme: undefined,
    debug: false
  });

  assert.deepEqual(resolveBrandOptions({ pageTitle: '' }, {}), {
    brand: 'default',
    pageTitle: '',
    colorScheme: undefined,
    debug: false
  });

  assert.throws(() => resolveBrandOptions(undefined, { BRAND: '' }), /Invalid brand name/);
});

test('rejects unsafe brand names', () => {
  assert.throws(() => resolveBrandOptions({ brand: '../brand2' }, {}), /Invalid brand name/);
});

test('renders deterministic color schemes only for non-empty objects', () => {
  assert.equal(buildColorSchemeStyle(undefined), undefined);
  assert.equal(buildColorSchemeStyle({}), undefined);
  assert.equal(
    buildColorSchemeStyle({ '--brand-secondary': '#ffffff', '--brand-primary': '#111111' }),
    '<style>:root { --brand-primary: #111111; --brand-secondary: #ffffff; }</style>'
  );
  assert.throws(() => buildColorSchemeStyle({ color: 'red' }), /Invalid CSS custom property/);
  assert.throws(() => buildColorSchemeStyle({ '--brand-primary': 10 }), /must be a string/);
});

test('creates default layers before selected-brand layers', (context) => {
  const root = temporaryBrandedPackage(context);
  mkdirSync(join(root, 'brand-assets', 'default', 'public'), { recursive: true });
  mkdirSync(join(root, 'brand-assets', 'brand2', 'public'), { recursive: true });

  const brandedPackages = resolveBrandedPackages([
    {
      name: '@upfluence/example',
      root,
      isAddon: true,
      metadata: { assets: './brand-assets' }
    }
  ]);

  assert.deepEqual(
    createAssetLayers(brandedPackages, 'brand2').map(({ brand, packageName, destination }) => ({
      brand,
      packageName,
      destination
    })),
    [
      { brand: 'default', packageName: '@upfluence/example', destination: '@upfluence/example' },
      { brand: 'brand2', packageName: '@upfluence/example', destination: '@upfluence/example' }
    ]
  );
});

test('deduplicates real package roots and rejects destination conflicts', (context) => {
  const firstRoot = temporaryBrandedPackage(context);
  const secondRoot = temporaryBrandedPackage(context);
  mkdirSync(join(firstRoot, 'brand-assets'), { recursive: true });
  mkdirSync(join(secondRoot, 'brand-assets'), { recursive: true });

  const repeatedCandidate = {
    name: '@upfluence/example',
    root: firstRoot,
    isAddon: true,
    metadata: { assets: './brand-assets' }
  };

  assert.equal(resolveBrandedPackages([repeatedCandidate, repeatedCandidate]).length, 1);
  assert.throws(
    () =>
      resolveBrandedPackages([
        repeatedCandidate,
        { ...repeatedCandidate, root: secondRoot }
      ]),
    /Multiple branded packages target/
  );
});

test('requires default public assets for every branded package', (context) => {
  const root = temporaryBrandedPackage(context);
  mkdirSync(join(root, 'brand-assets'), { recursive: true });
  const brandedPackages = resolveBrandedPackages([brandedPackageCandidate(root)]);

  assert.throws(() => createAssetLayers(brandedPackages, 'default'), /default public assets does not exist/);

  mkdirSync(join(root, 'brand-assets', 'default'), { recursive: true });
  writeFileSync(join(root, 'brand-assets', 'default', 'public'), 'not a directory');

  assert.throws(() => createAssetLayers(brandedPackages, 'default'), /default public assets is not a directory/);
});

test('skips missing brand overrides and rejects invalid override directories', (context) => {
  const root = temporaryBrandedPackage(context);
  mkdirSync(join(root, 'brand-assets', 'default', 'public'), { recursive: true });
  const brandedPackages = resolveBrandedPackages([brandedPackageCandidate(root)]);

  assert.deepEqual(
    createAssetLayers(brandedPackages, 'brand2').map(({ brand }) => brand),
    ['default']
  );

  mkdirSync(join(root, 'brand-assets', 'brand2'), { recursive: true });
  writeFileSync(join(root, 'brand-assets', 'brand2', 'public'), 'not a directory');

  assert.throws(() => createAssetLayers(brandedPackages, 'brand2'), /brand2 public assets is not a directory/);
});

test('rejects default and override directories that escape through symlinks', (context) => {
  const defaultRoot = temporaryBrandedPackage(context);
  const overrideRoot = temporaryBrandedPackage(context);
  const outsideRoot = temporaryBrandedPackage(context);
  mkdirSync(join(defaultRoot, 'brand-assets', 'default'), { recursive: true });
  mkdirSync(join(overrideRoot, 'brand-assets', 'default', 'public'), { recursive: true });
  mkdirSync(join(overrideRoot, 'brand-assets', 'brand2'), { recursive: true });
  mkdirSync(join(outsideRoot, 'public'), { recursive: true });
  symlinkSync(join(outsideRoot, 'public'), join(defaultRoot, 'brand-assets', 'default', 'public'));
  symlinkSync(join(outsideRoot, 'public'), join(overrideRoot, 'brand-assets', 'brand2', 'public'));

  assert.throws(
    () => createAssetLayers(resolveBrandedPackages([brandedPackageCandidate(defaultRoot)]), 'default'),
    /must stay within/
  );
  assert.throws(
    () => createAssetLayers(resolveBrandedPackages([brandedPackageCandidate(overrideRoot)]), 'brand2'),
    /must stay within/
  );
});

test('rejects asset roots outside their package', (context) => {
  const root = temporaryBrandedPackage(context);

  assert.throws(
    () =>
      resolveBrandedPackages([
        {
          name: '@upfluence/example',
          root,
          isAddon: true,
          metadata: { assets: '../brand-assets' }
        }
      ]),
    /must stay within/
  );
});

function temporaryBrandedPackage(context) {
  const root = mkdtempSync(join(tmpdir(), 'ember-brand-bundler-'));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function brandedPackageCandidate(root) {
  return {
    name: '@upfluence/example',
    root,
    isAddon: true,
    metadata: { assets: './brand-assets' }
  };
}
