import { BrandBundlerError, BRAND_METADATA_KEY, type BrandedPackageCandidate } from '../core/index.js';
import type { EmberCliAddon, EmberCliApplication, PackageManifest } from './types.js';

export function discoverBrandedPackageCandidates(app: EmberCliApplication): BrandedPackageCandidate[] {
  return discoverAddons(app.project.addons).reduce(
    collectAddonPackage,
    collectPackage(
      [],
      app.project.pkg,
      app.project.root,
      isAddonPackage(app.project.pkg)
    )
  );
}

function discoverAddons(addons: readonly EmberCliAddon[]): EmberCliAddon[] {
  const visitedAddons = new Set<EmberCliAddon>();
  const pendingAddons = [...addons].reverse();
  const discoveredAddons: EmberCliAddon[] = [];

  while (pendingAddons.length > 0) {
    const addon = pendingAddons.pop();

    if (addon === undefined || visitedAddons.has(addon)) continue;

    visitedAddons.add(addon);
    discoveredAddons.push(addon);
    pendingAddons.push(...[...(addon.addons ?? [])].reverse());
  }

  return discoveredAddons;
}

function collectAddonPackage(
  brandedPackageCandidates: BrandedPackageCandidate[],
  addon: EmberCliAddon
): BrandedPackageCandidate[] {
  return addon.pkg === undefined
    ? brandedPackageCandidates
    : collectPackage(brandedPackageCandidates, addon.pkg, addon.root ?? addon.pkg.root, true);
}

function collectPackage(
  brandedPackageCandidates: BrandedPackageCandidate[],
  pkg: PackageManifest,
  root: unknown,
  isAddon: boolean
): BrandedPackageCandidate[] {
  if (!Object.prototype.hasOwnProperty.call(pkg, BRAND_METADATA_KEY)) return brandedPackageCandidates;

  if (typeof root !== 'string' || root === '') {
    throw new BrandBundlerError(`Unable to determine the package root for ${pkg.name}.`);
  }

  return [
    ...brandedPackageCandidates,
    {
      name: pkg.name as string,
      root,
      isAddon,
      metadata: pkg[BRAND_METADATA_KEY]
    }
  ];
}

function isAddonPackage(pkg: PackageManifest): boolean {
  return Array.isArray(pkg.keywords) && pkg.keywords.includes('ember-addon');
}
