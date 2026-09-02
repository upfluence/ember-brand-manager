# @upfluence/ember-brand-bundler

Host-side build tooling for applications that consume branded assets for both themselves and their dependencies.

## Ember CLI setup

This package ships a build-time API for Ember CLI that allows the host application to support branded assets. It is intended to be used in the host application's `ember-cli-build.js` file.

```js
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { withBrandAssets } = require('@upfluence/ember-brand-bundler/ember-cli');

module.exports = function (defaults) {
  const brand = process.env.BRAND ?? 'default';
  const app = new EmberApp(defaults, {});

  return withBrandAssets(app, {
    brand,
    pageTitle: process.env.BRAND_PAGE_TITLE,
    colorScheme:
      brand === 'brand2'
        ? require('./brand-assets/brand2/color-scheme.json')
        : undefined,
    debug: process.env.EBM_DEBUG === 'true'
  }).toTree();
};
```

`withBrandAssets` returns the same Ember application, so it can also be passed to an existing build finalizer.

## Branded package metadata

Every package that ships branded assets, including the host application when applicable, declares its asset root in `package.json` using the `@upfluence/ember-brand-manager/metadata` key.

```json
{
  "@upfluence/ember-brand-manager/metadata": {
    "assets": "./brand-assets"
  }
}
```

Assets use this layout:

```text
brand-assets/
  default/
    public/
  brand2/
    public/
```

Every branded package must include `default/public`. The default layer is always included, then an available selected-brand layer overrides files whenever paths match. Application assets are emitted at the distribution root while addon assets are emitted under their own namespace.

The bundler also registers `{ brand }` as each branded package's own `@embroider/macros` configuration. Runtime code within the host or an addon can therefore read its selected brand through `getOwnConfig().brand`.

## Options

- `brand` defaults to `BRAND` or `default`.
- `pageTitle` defaults to `BRAND_PAGE_TITLE` or `Upfluence Software`.
- `colorScheme` accepts an object of CSS custom properties. No style is emitted when omitted or empty.
- `debug` defaults to whether `EBM_DEBUG` equals `true`.

Color schemes are passed explicitly and are not loaded from branded package directories.
