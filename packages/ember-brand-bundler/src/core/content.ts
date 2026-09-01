import { BrandBundlerError } from './errors.js';
import type { ResolvedBrandAssetOptions } from './types.js';

const CUSTOM_PROPERTY_PATTERN = /^--[A-Za-z0-9_-]+$/;

export function buildColorSchemeStyle(colorScheme: unknown): string | undefined {
  if (colorScheme === undefined) return undefined;

  if (typeof colorScheme !== 'object' || colorScheme === null || Array.isArray(colorScheme)) {
    throw new BrandBundlerError('The color scheme must be an object of CSS custom properties.');
  }

  const declarations = Object.entries(colorScheme)
    .map(([property, value]) => {
      if (!CUSTOM_PROPERTY_PATTERN.test(property)) {
        throw new BrandBundlerError(`Invalid CSS custom property: ${property}.`);
      }

      if (typeof value !== 'string') {
        throw new BrandBundlerError(`The value for ${property} must be a string.`);
      }

      return `${property}: ${value};`;
    });

  return declarations.length === 0 ? undefined : `<style>:root { ${declarations.join(' ')} }</style>`;
}

export function renderBrandContent(type: string, options: ResolvedBrandAssetOptions): string | undefined {
  if (type === 'page-title') return options.pageTitle;
  if (type === 'head-footer') return buildColorSchemeStyle(options.colorScheme);

  return undefined;
}
