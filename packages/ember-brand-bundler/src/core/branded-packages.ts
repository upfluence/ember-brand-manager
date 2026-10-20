import { realpathSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import { BrandBundlerError } from './errors';
import {
  DEFAULT_BRAND,
  type AssetLayer,
  type BrandedPackage,
  type BrandedPackageCandidate,
  type TranslationLayer
} from './types';

interface BrandMetadata {
  assets?: string;
  translations?: string;
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
  const defaultLayers = brandedPackages.reduce<AssetLayer[]>(
    (layers, brandedPackage) =>
      brandedPackage.assetRoot === undefined
        ? layers
        : [...layers, defaultAssetLayer(brandedPackage, brandedPackage.assetRoot)],
    []
  );

  return selectedBrand === DEFAULT_BRAND
    ? defaultLayers
    : [
      ...defaultLayers,
      ...brandedPackages.reduce<AssetLayer[]>((layers, brandedPackage) => {
        if (brandedPackage.assetRoot === undefined) return layers;

        const layer = brandOverrideLayer(brandedPackage, brandedPackage.assetRoot, selectedBrand);
        return layer === undefined ? layers : [...layers, layer];
      }, [])
    ];
}

export function createTranslationLayers(
  brandedPackages: readonly BrandedPackage[],
  selectedBrand: string
): TranslationLayer[] {
  const defaultLayers = brandedPackages.reduce<TranslationLayer[]>(
    (layers, brandedPackage) =>
      brandedPackage.translationRoot === undefined
        ? layers
        : [...layers, defaultTranslationLayer(brandedPackage, brandedPackage.translationRoot)],
    []
  );

  return selectedBrand === DEFAULT_BRAND
    ? defaultLayers
    : [
      ...defaultLayers,
      ...brandedPackages.reduce<TranslationLayer[]>((layers, brandedPackage) => {
        if (brandedPackage.translationRoot === undefined) return layers;

        const layer = brandTranslationOverrideLayer(
          brandedPackage,
          brandedPackage.translationRoot,
          selectedBrand
        );
        return layer === undefined ? layers : [...layers, layer];
      }, [])
    ];
}

function collectBrandedPackage(
  resolution: BrandedPackageResolution,
  candidate: BrandedPackageCandidate
): BrandedPackageResolution {
  const root = packageDirectory(candidate);
  const metadata = validateMetadata(candidate.name, candidate.metadata);

  if (!candidate.isAddon && metadata.translations !== undefined) {
    throw new BrandBundlerError(
      `Brand translations for ${candidate.name} are only supported for addon packages. Keep host translations in the application's normal Ember Intl input.`
    );
  }

  return resolution.brandedPackagesByRoot.has(root)
    ? resolution
    : registerBrandedPackage(resolution, {
      name: candidate.name,
      root,
      assetRoot: metadata.assets === undefined
        ? undefined
        : metadataDirectory(candidate.name, root, 'Asset root', metadata.assets),
      translationRoot: metadata.translations === undefined
        ? undefined
        : metadataDirectory(candidate.name, root, 'Translation root', metadata.translations),
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

function defaultAssetLayer(brandedPackage: BrandedPackage, assetRoot: string): AssetLayer {
  return {
    brand: DEFAULT_BRAND,
    packageName: brandedPackage.name,
    sourceDirectory: defaultAssetDirectory(brandedPackage.name, assetRoot),
    destination: brandedPackage.destination
  };
}

function brandOverrideLayer(
  brandedPackage: BrandedPackage,
  assetRoot: string,
  brand: string
): AssetLayer | undefined {
  const sourceDirectory = brandOverrideDirectory(
    brandedPackage.name,
    assetRoot,
    brand,
    'public',
    'public assets'
  );

  return sourceDirectory === undefined
    ? undefined
    : {
      brand,
      packageName: brandedPackage.name,
      sourceDirectory,
      destination: brandedPackage.destination
    };
}

function defaultTranslationLayer(brandedPackage: BrandedPackage, translationRoot: string): TranslationLayer {
  return {
    brand: DEFAULT_BRAND,
    packageName: brandedPackage.name,
    sourceDirectory: defaultTranslationDirectory(brandedPackage.name, translationRoot)
  };
}

function brandTranslationOverrideLayer(
  brandedPackage: BrandedPackage,
  translationRoot: string,
  brand: string
): TranslationLayer | undefined {
  const sourceDirectory = brandOverrideDirectory(
    brandedPackage.name,
    translationRoot,
    brand,
    'translations',
    'translations'
  );

  return sourceDirectory === undefined
    ? undefined
    : {
      brand,
      packageName: brandedPackage.name,
      sourceDirectory
    };
}

function packageDirectory(candidate: BrandedPackageCandidate): string {
  return expectedDirectory(candidate.root, `Package root for ${candidate.name}`);
}

function metadataDirectory(packageName: string, packageRoot: string, rootLabel: string, path: string): string {
  const label = `${rootLabel} for ${packageName}`;
  const metadataPath = resolve(packageRoot, path);

  ensureContainedPath(packageRoot, metadataPath, label);

  const metadataRoot = expectedDirectory(metadataPath, label);
  ensureContainedPath(packageRoot, metadataRoot, label);

  return metadataRoot;
}

function defaultAssetDirectory(packageName: string, assetRoot: string): string {
  return defaultBrandDirectory(packageName, assetRoot, 'public', 'public assets');
}

function defaultTranslationDirectory(packageName: string, translationRoot: string): string {
  return defaultBrandDirectory(packageName, translationRoot, 'translations', 'translations');
}

function defaultBrandDirectory(packageName: string, root: string, directoryName: string, description: string): string {
  const label = `${packageName} default ${description}`;
  const expectedPath = join(root, DEFAULT_BRAND, directoryName);
  const sourceDirectory = expectedDirectory(expectedPath, label);

  ensureContainedPath(root, sourceDirectory, label);

  return sourceDirectory;
}

function brandOverrideDirectory(
  packageName: string,
  root: string,
  brand: string,
  directoryName: string,
  description: string
): string | undefined {
  const label = `${packageName} ${brand} ${description}`;
  const expectedPath = join(root, brand, directoryName);

  ensureContainedPath(root, expectedPath, label);

  const sourceDirectory = directory(expectedPath, label);

  if (sourceDirectory !== undefined) ensureContainedPath(root, sourceDirectory, label);

  return sourceDirectory;
}

function validateMetadata(packageName: string, metadata: unknown): BrandMetadata {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    throw new BrandBundlerError(`Brand metadata for ${packageName} must be an object.`);
  }

  const values = metadata as Record<string, unknown>;
  const brandMetadata = {
    assets: validateMetadataPath(packageName, 'assets', values.assets),
    translations: validateMetadataPath(packageName, 'translations', values.translations)
  };

  if (brandMetadata.assets === undefined && brandMetadata.translations === undefined) {
    throw new BrandBundlerError(
      `Brand metadata for ${packageName} must declare a non-empty assets or translations path.`
    );
  }

  return brandMetadata;
}

function validateMetadataPath(
  packageName: string,
  field: keyof BrandMetadata,
  value: unknown
): string | undefined {
  if (value === undefined) return undefined;

  if (typeof value !== 'string' || value.trim() === '') {
    throw new BrandBundlerError(`Brand metadata for ${packageName} must declare a non-empty ${field} path.`);
  }

  if (isAbsolute(value)) {
    throw new BrandBundlerError(`Brand metadata for ${packageName} must use a relative ${field} path.`);
  }

  return value;
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
