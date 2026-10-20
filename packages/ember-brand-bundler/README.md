# @upfluence/ember-brand-bundler

Host-side build tooling for applications that consume branded assets and translations from their dependencies.

## Ember CLI setup

This package ships a build-time API for Ember CLI that allows the host application to support branded assets and translations. It is intended to be used in the host application's `ember-cli-build.js` file.

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

Packages opt into public assets, Ember Intl translations, or both through independent metadata fields. The fields may point to the same brand root.

```json
{
  "@upfluence/ember-brand-manager/metadata": {
    "assets": "./brand-assets",
    "translations": "./brand-assets"
  }
}
```

At least one field is required. An assets-only package may omit `translations`, and a translations-only addon may omit `assets`.

The complete layout is:

```text
brand-assets/
  default/
    public/
    translations/
      en-us.yaml
  brand2/
    public/
    translations/
      en-us.yaml
```

Declaring `assets` requires `default/public`; the selected brand's `public` directory is optional. The default layer is always included before an available selected-brand override. Application assets are emitted at the distribution root while addon assets are emitted under their own namespace.

Declaring `translations` requires `default/translations`; the selected brand's `translations` directory is optional. Translation metadata is supported for addons only because host translations already use the application's normal Ember Intl input. The host must depend directly on `ember-intl`. Only `.yaml` and `.yml` catalogs are included, with every addon's default catalog merged before selected-brand overrides. Translation keys should be package-namespaced to avoid conflicts.

The bundler also registers `{ brand }` as each branded package's own `@embroider/macros` configuration. Runtime code within the host or an addon can therefore read its selected brand through `getOwnConfig().brand`.

## Options

- `brand` defaults to `BRAND` or `default`.
- `pageTitle` defaults to `BRAND_PAGE_TITLE` or `Upfluence Software`.
- `colorScheme` accepts an object of CSS custom properties. No style is emitted when omitted or empty.
- `debug` defaults to whether `EBM_DEBUG` equals `true`.

Color schemes are passed explicitly and are not loaded from branded package directories.
