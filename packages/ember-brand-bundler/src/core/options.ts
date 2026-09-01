import { BrandBundlerError } from './errors.js';
import {
  DEFAULT_BRAND,
  DEFAULT_PAGE_TITLE,
  type BrandAssetOptions,
  type Environment,
  type ResolvedBrandAssetOptions
} from './types.js';

const BRAND_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function resolveBrandOptions(
  options: BrandAssetOptions | undefined,
  environment: Environment = process.env
): ResolvedBrandAssetOptions {
  if (options !== undefined && (!isObject(options) || Array.isArray(options))) {
    throw new BrandBundlerError('Brand asset options must be an object.');
  }

  const resolvedOptions = {
    brand: options?.brand ?? environment.BRAND ?? DEFAULT_BRAND,
    pageTitle: options?.pageTitle ?? environment.BRAND_PAGE_TITLE ?? DEFAULT_PAGE_TITLE,
    colorScheme: options?.colorScheme,
    debug: options?.debug ?? environment.EBM_DEBUG === 'true'
  };

  if (typeof resolvedOptions.brand !== 'string' || !BRAND_NAME_PATTERN.test(resolvedOptions.brand)) {
    throw new BrandBundlerError(`Invalid brand name: ${String(resolvedOptions.brand)}.`);
  }

  if (typeof resolvedOptions.pageTitle !== 'string') {
    throw new BrandBundlerError('The page title must be a string.');
  }

  if (typeof resolvedOptions.debug !== 'boolean') {
    throw new BrandBundlerError('The debug option must be a boolean.');
  }

  return resolvedOptions;
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}
