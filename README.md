# Ember brand tooling

This pnpm workspace contains the Ember runtime addon and the host-side build tooling used for Upfluence branding.

## Packages

- `@upfluence/ember-brand-manager`: the existing classic Ember addon.
- `@upfluence/ember-brand-bundler`: the host-side Ember CLI build tooling.

## Development

```shell
pnpm install
pnpm lint
pnpm test
pnpm build
```

Package-specific documentation lives in each package directory.

## Releases

The packages are versioned independently. Run releases from a clean `main` branch with an upstream; `release-it` updates only the selected package, creates a package-qualified tag, and pushes the release commit and tag. GitHub Actions publishes the package represented by that tag.

Create the first bundler beta before the manager beta:

```shell
pnpm run release:bundler minor --preRelease=beta
# @upfluence/ember-brand-bundler@0.1.0-beta.0

pnpm run release:manager major --preRelease=beta
# @upfluence/ember-brand-manager@2.0.0-beta.0
```

Continue a package's beta independently:

```shell
pnpm run release:bundler --preRelease
pnpm run release:manager --preRelease
```

Promote each package independently when it is stable:

```shell
pnpm run release:bundler minor
pnpm run release:manager major
```

Prereleases are published under their prerelease identifier, such as `beta`; stable releases are published under `latest`. Release commands do not publish locally or create GitHub Releases.
