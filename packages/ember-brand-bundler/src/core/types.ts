export const BRAND_METADATA_KEY = '@upfluence/ember-brand-manager/metadata';
export const DEFAULT_BRAND = 'default';
export const DEFAULT_PAGE_TITLE = 'Upfluence Software';

export interface BrandAssetOptions {
  brand?: string;
  pageTitle?: string;
  colorScheme?: Readonly<Record<string, string>>;
  debug?: boolean;
}

export interface ResolvedBrandAssetOptions {
  brand: string;
  pageTitle: string;
  colorScheme?: Readonly<Record<string, string>>;
  debug: boolean;
}

export interface BrandedPackageCandidate {
  name: string;
  root: string;
  isAddon: boolean;
  metadata: unknown;
}

export interface BrandedPackage {
  name: string;
  root: string;
  assetRoot: string;
  destination: string;
}

export interface AssetLayer {
  brand: string;
  packageName: string;
  sourceDirectory: string;
  destination: string;
}

export type Environment = Readonly<Record<string, string | undefined>>;
