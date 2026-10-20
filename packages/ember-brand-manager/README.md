# @upfluence/ember-brand-manager

Runtime helpers and decorators for branded Ember applications.

## Compatibility

- Ember.js 3.28 or above
- Ember CLI 3.28 or above
- Node.js 20 or above for host builds

## Installation

Install the runtime addon and the host-side build integration:

```shell
ember install @upfluence/ember-brand-manager
pnpm add --save-dev @upfluence/ember-brand-bundler
```

Branding is host-managed. The runtime addon does not move public assets, contribute translations, or inject page content on its own.

## Host setup

Configure branding in the parent application's `ember-cli-build.js`:

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

The host index must expose the content slots used by the bundler:

```html
<title>{{content-for "page-title"}}</title>
{{content-for "head-footer"}}
```

Omitting `withBrandAssets` is not supported. Existing applications must move branding configuration into their host build.

## Branded packages

Applications and addons opt into public assets and addon translations through independent metadata fields. Both fields may point to the same brand root:

```json
{
  "@upfluence/ember-brand-manager/metadata": {
    "assets": "./brand-assets",
    "translations": "./brand-assets"
  }
}
```

At least one field is required. Packages that only ship one capability can omit the other field.

Brand content follows this layout:

```text
brand-assets/
  default/
    public/
      assets/
        logo.svg
    translations/
      en-us.yaml
  brand2/
    public/
      assets/
        logo.svg
    translations/
      en-us.yaml
```

Declaring `assets` requires `default/public`. The default layer is always included, then an available selected-brand layer overrides files with matching paths. Addon assets remain namespaced beneath the addon package name.

Declaring `translations` requires `default/translations`, supports `.yaml` and `.yml` catalogs, and requires the host to depend directly on Ember Intl. Translation metadata is addon-only; host translations remain in the application's normal Ember Intl input. All default catalogs are merged before selected-brand overrides, and keys should be package-namespaced to avoid conflicts.

The bundler registers `{ brand }` as the package's own `@embroider/macros` configuration. Runtime code in every branded application or addon can read the selected brand through `getOwnConfig().brand`.

## Color schemes

Color schemes are optional objects passed by the host. They are not discovered in branded package directories.

```js
const colorScheme = {
  '--color-primary': '#123c69',
  '--color-accent': '#f26b38'
};
```

When defined, the bundler emits the properties in a `:root` style block. Undefined and empty objects emit no style.

## Helper

The `required-brand` helper compares a brand name with the build-time brand:

```handlebars
{{#if (required-brand "brand2")}}
  Brand-specific content
{{else}}
  Default content
{{/if}}
```

## Decorator

The `@requiredBrand` decorator redirects a route when the configured brand does not match:

```javascript
import Route from '@ember/routing/route';
import { requiredBrand } from '@upfluence/ember-brand-manager/decorators/required-brand';

@requiredBrand('brand2', 'fallback')
export default class BrandRoute extends Route {}
```

## Debugging

Set `EBM_DEBUG=true` to print discovered branded packages and asset layers during the build.

## License

This project is licensed under the [MIT License](LICENSE).
