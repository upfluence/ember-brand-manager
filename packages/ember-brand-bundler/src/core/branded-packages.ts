import { realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import { BrandBundlerError } from './errors.js';
import {
  DEFAULT_BRAND,
  type AssetLayer,
  type BrandedPackage,
  type BrandedPackageCandidate
} from './types.js';

interface BrandMetadata {
  assets: string;
}

interface BrandedPackageResolution {
  brandedPackagesByRoot: Map<string, BrandedPackage>;
  rootsByDestination: Map<string, string>;
}

export function resolveBrandedPackages(candidates: readonly BrandedPackageCandidate[]): BrandedPackage[] {
  return [
    ...candidates
      .reduce<BrandedPackageResolution>(
        collectBrandedPackage,
        {
          brandedPackagesByRoot: new Map(),
          rootsByDestination: new Map()
        }
      )
      .brandedPackagesByRoot.values()
  ];
}

export function createAssetLayers(brandedPackages: readonly BrandedPackage[], selectedBrand: string): AssetLayer[] {
  const defaultLayers = brandedPackages.map(defaultAssetLayer);

  return selectedBrand === DEFAULT_BRAND
    ? defaultLayers
    : [
      ...defaultLayers,
      ...brandedPackages
        .map((brandedPackage) => brandOverrideLayer(brandedPackage, selectedBrand))
        .reduce<AssetLayer[]>((layers, layer) => (layer === undefined ? layers : [...layers, layer]), [])
    ];
}

function collectBrandedPackage(
  resolution: BrandedPackageResolution,
  candidate: BrandedPackageCandidate
): BrandedPackageResolution {
  const root = packageDirectory(candidate);

  return resolution.brandedPackagesByRoot.has(root)
    ? resolution
    : registerBrandedPackage(resolution, {
      name: candidate.name,
      root,
      assetRoot: assetDirectory(candidate, root),
      destination: candidate.isAddon ? candidate.name : '.'
    });
}

function registerBrandedPackage(
  resolution: BrandedPackageResolution,
  brandedPackage: BrandedPackage
): BrandedPackageResolution {
  const conflictingRoot = resolution.rootsByDestination.get(brandedPackage.destination);

  if (conflictingRoot !== undefined) {
    throw new BrandBundlerError(
      `Multiple branded packages target ${brandedPackage.destination}: ${conflictingRoot} and ${brandedPackage.root}.`
    );
  }

  resolution.brandedPackagesByRoot.set(brandedPackage.root, brandedPackage);
  resolution.rootsByDestination.set(brandedPackage.destination, brandedPackage.root);

  return resolution;
}

function defaultAssetLayer(brandedPackage: BrandedPackage): AssetLayer {
  return {
    brand: DEFAULT_BRAND,
    packageName: brandedPackage.name,
    sourceDirectory: defaultDirectory(brandedPackage),
    destination: brandedPackage.destination
  };
}

function brandOverrideLayer(brandedPackage: BrandedPackage, brand: string): AssetLayer | undefined {
  const sourceDirectory = brandOverrideDirectory(brandedPackage, brand);

  return sourceDirectory === undefined
    ? undefined
    : {
      brand,
      packageName: brandedPackage.name,
      sourceDirectory,
      destination: brandedPackage.destination
    };
}

function packageDirectory(candidate: BrandedPackageCandidate): string {
  return expectedDirectory(candidate.root, `Package root for ${candidate.name}`);
}

function assetDirectory(candidate: BrandedPackageCandidate, packageRoot: string): string {
  const label = `Asset root for ${candidate.name}`;
  const assetPath = resolve(packageRoot, validateMetadata(candidate.name, candidate.metadata).assets);

  ensureContainedPath(packageRoot, assetPath, label);

  const assetRoot = expectedDirectory(assetPath, label);
  ensureContainedPath(packageRoot, assetRoot, label);

  return assetRoot;
}

function defaultDirectory(brandedPackage: BrandedPackage): string {
  const label = `${brandedPackage.name} default public assets`;
  const expectedPath = join(brandedPackage.assetRoot, DEFAULT_BRAND, 'public');
  const sourceDirectory = expectedDirectory(expectedPath, label);

  ensureContainedPath(brandedPackage.assetRoot, sourceDirectory, label);

  return sourceDirectory;
}

function brandOverrideDirectory(brandedPackage: BrandedPackage, brand: string): string | undefined {
  const label = `${brandedPackage.name} ${brand} public assets`;
  const expectedPath = join(brandedPackage.assetRoot, brand, 'public');

  ensureContainedPath(brandedPackage.assetRoot, expectedPath, label);

  const sourceDirectory = directory(expectedPath, label);

  if (sourceDirectory !== undefined) ensureContainedPath(brandedPackage.assetRoot, sourceDirectory, label);

  return sourceDirectory;
}

function validateMetadata(packageName: string, metadata: unknown): BrandMetadata {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    throw new BrandBundlerError(`Brand metadata for ${packageName} must be an object.`);
  }

  const assets = (metadata as Record<string, unknown>).assets;

  if (typeof assets !== 'string' || assets.trim() === '') {
    throw new BrandBundlerError(`Brand metadata for ${packageName} must declare a non-empty assets path.`);
  }

  if (isAbsolute(assets)) {
    throw new BrandBundlerError(`Brand metadata for ${packageName} must use a relative assets path.`);
  }

  return { assets };
}

function expectedDirectory(path: string, label: string): string {
  const resolvedDirectory = directory(path, label);

  if (resolvedDirectory === undefined) {
    throw new BrandBundlerError(`${label} does not exist: ${resolve(path)}.`);
  }

  return resolvedDirectory;
}

function directory(path: string, label: string): string | undefined {
  const resolvedDirectory = resolve(path);

  try {
    if (!statSync(resolvedDirectory).isDirectory()) {
      throw new BrandBundlerError(`${label} is not a directory: ${resolvedDirectory}.`);
    }

    return realpathSync(resolvedDirectory);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }

    if (error instanceof BrandBundlerError) {
      throw error;
    }

    throw new BrandBundlerError(`Unable to inspect ${label}: ${resolvedDirectory}.`);
  }
}

function ensureContainedPath(parent: string, child: string, label: string): void {
  const relativePath = relative(parent, child);

  if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new BrandBundlerError(`${label} must stay within ${parent}.`);
  }
}
