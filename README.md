@upfluence/ember-brand-manager
==============================================================================

White-labeling brand manager for Ember.

Work in progress - more features to come !

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.24 or above
* Ember CLI v3.24 or above
* Node.js v12 or above


Installation
------------------------------------------------------------------------------

```
ember install @upfluence/ember-brand-manager
```

Create a `brand-assets` folder at the root of your repository
Move your public assets into this new folder. You should have something that looks like :
└── brand-assets/
    ├── default/
    │   └── public/
    │       ├── favicon.png
    │       └── assets/
    │           └── images/
    │               └──logo.png
    └── brand2/
        └── public/
            ├── favicon.png
            └── assets/
                └── images/
                    └──logo.png

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

## Engines
This addon will also work with ember-engines. The destination folder in the `dist` will have the pakage name in order to keep the original asset serving of the engines functional.

## Debugging
Some debugging is available by setting the EBM_DEBUG env variable to true.

`EBM_DEBUG=true BRAND=brand2 ember build`

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
