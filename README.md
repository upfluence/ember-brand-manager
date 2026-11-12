<div align="center">
  <img src=".github/assets/logo.svg" width="96" height="96" alt="">
  <h1>@upfluence/ember-brand-manager</h1>
  <p>White-labeling brand manager for Ember.</p>

[![ci](https://github.com/upfluence/ember-brand-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/upfluence/ember-brand-manager/actions/workflows/ci.yml)
[![Coverage](https://sonarqube.upfluence.co/api/project_badges/measure?project=ember-brand-manager&metric=coverage&token=sqb_24fde0af6065947fd22cfd11abdf87ed69e7f20d)](https://sonarqube.upfluence.co/dashboard?id=ember-brand-manager)
[![Maintainability Rating](https://sonarqube.upfluence.co/api/project_badges/measure?project=ember-brand-manager&metric=sqale_rating&token=sqb_24fde0af6065947fd22cfd11abdf87ed69e7f20d)](https://sonarqube.upfluence.co/dashboard?id=ember-brand-manager)
[![Quality Gate Status](https://sonarqube.upfluence.co/api/project_badges/measure?project=ember-brand-manager&metric=alert_status&token=sqb_24fde0af6065947fd22cfd11abdf87ed69e7f20d)](https://sonarqube.upfluence.co/dashboard?id=ember-brand-manager)
[![Code Smells](https://sonarqube.upfluence.co/api/project_badges/measure?project=ember-brand-manager&metric=code_smells&token=sqb_24fde0af6065947fd22cfd11abdf87ed69e7f20d)](https://sonarqube.upfluence.co/dashboard?id=ember-brand-manager)

[Compatibility](#compatibility) •
[Installation](#installation) •
[Usage](#usage) •
[Contributing](#contributing) •
[License](#license)

</div>

Work in progress - more features to come !

Compatibility
------------------------------------------------------------------------------

- Ember.js v6.12 or above
- Node.js v24 or above
- pnpm 10

Apps on Ember.js below 6.12 should stay on `1.x`.

**Breaking:** support for Ember versions below 6.12 has been dropped. The addon now relies on the `service` import from
`@ember/service`.


Installation
------------------------------------------------------------------------------

```
pnpm add @upfluence/ember-brand-manager
```

Required peer dependency: `ember-source` `^6.12.0`.

Create a `brand-assets` folder at the root of your repository
Move your public assets into this new folder. You should have something that looks like :
```shell
└── brand-assets/
    ├── default/
    │   └── public/
    │       ├── favicon.png
    │       └── assets/
    │           └── images/
    │               └──logo.png
    └── brand2/
        └── color-scheme.json
        └── public/
            ├── favicon.png
            └── assets/
                └── images/
                    └──logo.png
```

Usage
------------------------------------------------------------------------------

## General info
The default folder will always be added when serving or building to the dist folder.
the `brand2` should be the name of another brand that uses differents assets to the ones from the `default` version. 
Assets for `brand2` should have the same name as the ones for the `default` brand ; this way they will overwrite the ones from the `default` folder.

## Building or serving for another brand
Your project will only serve or build the `default` brand on `ember build` or `ember start`.
To specify another brand, either define a `BRAND` environment value in your environment or prepend your launch commands with the brand name.

`BRAND=brand2 ember build`
or
`BRAND=brand2 ember s`

## Addons

This addon will also work with ember-addons. The destination folder in the `dist` will have the pakage name in order to keep the original asset serving of the addon functional. Engines being Ember Addons, they will also be supported natively.

## Color Schemes

The `brand-assets/[brand]/color-scheme.json` is a key-value formatted file that maps CSS Variables to their values.
Eg.:

```json
{
  "--color-primary-50": "#faf5ff",
  "--color-primary-100": "#f3e8ff",
  "--color-primary-400": "#C58CFE",
  "--color-primary-500": "#A241FF",
  "--color-primary-600": "#8521E0",
  "--color-primary-900": "#440973"
}
```

## Helpers

The `required-brand` helper gives an easy way of checking if the target-brand matches the one set during buildtime.
`required-brand` takes a brand name (string) as parameter, will compare it to the one configured at buildtime and return true/false if it matches.

A common usage would be to display data for two different brands (default & brand2) in a template.

```handlebars
  {{#if (required-brand "brand2")}}
    If brand2 is set at buildtime, brand2 content will be shown here
  {{else}}
    Default content will be displayed if brand2 is not set at buildtime
  {{/if}}
```

## Decorators

The `@requiredBrand` decorator allows restricting navigation to a specific route if the target brand is not the one defined at buildtime.
Its parameters are:
- `brand` - In our examples either "default" or "brand2"
- `fallbackRoute` - the route as string that will be called by the Ember router's `transitionTo` method

Example:
```javascript
  import { requiredBrand } from '@upfluence/ember-brand-manager/decorators/required-brand';

  @requiredBrand('brand2', 'dashboardForBrand2')
  export default class Dashboard extends Route {}
```

## Debugging
Some debugging is available by setting the EBM_DEBUG env variable to true.

`EBM_DEBUG=true BRAND=brand2 ember build`

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
