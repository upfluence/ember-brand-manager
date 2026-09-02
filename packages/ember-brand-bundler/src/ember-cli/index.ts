import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import Funnel from 'broccoli-funnel';
import mergeTrees from 'broccoli-merge-trees';

import {
  createAssetLayers,
  renderBrandContent,
  resolveBrandOptions,
  resolveBrandedPackages,
  type BrandAssetOptions,
  type ResolvedBrandAssetOptions
} from '../core/index.js';
import { discoverBrandedPackageCandidates } from './discovery.js';
import { configureBrandedPackages } from './macros.js';
import type { EmberCliAddon, EmberCliApplication, PackageManifest } from './types.js';

const CONTENT_ADDON_NAME = '@upfluence/ember-brand-bundler';

export type { BrandAssetOptions } from '../core/index.js';

export function withBrandAssets<T extends EmberCliApplication>(app: T, options?: BrandAssetOptions): T {
  const resolvedOptions = resolveBrandOptions(options);
  const brandedPackages = resolveBrandedPackages(discoverBrandedPackageCandidates(app));
  const layers = createAssetLayers(brandedPackages, resolvedOptions.brand);
  const headFooter = renderBrandContent('head-footer', resolvedOptions);

  configureBrandedPackages(app, brandedPackages, resolvedOptions.brand);
  attachPublicTrees(app, layers);
  registerContentAddon(app, resolvedOptions, headFooter);
  debugBrandPlan(resolvedOptions, brandedPackages.length, layers);

  return app;
}

function attachPublicTrees(
  app: EmberCliApplication,
  layers: ReturnType<typeof createAssetLayers>
): void {
  if (layers.length === 0) return;

  app.trees.public = mergeTrees(
    [
      app.trees.public,
      ...layers.map((layer) =>
        Funnel(layer.sourceDirectory, {
          destDir: layer.destination
        })
      )
    ].filter(Boolean) as Parameters<typeof mergeTrees>[0],
    { overwrite: true }
  );
}

/*
  * In case you're wondering... yes! we're programatically creating an Ember CLI addon to inject content into the
  * head-footer and page-title sections of the HTML document as Ember Application configuration has no support for this.
  * This is a known limitation of Ember CLI which doesn't expose contentFor hooks at application-level :(
*/
function registerContentAddon(
  app: EmberCliApplication,
  options: ResolvedBrandAssetOptions,
  headFooter: string | undefined
): void {
  const packageRoot = resolve(__dirname, '..', '..');
  app.project.addons.push(
    {
      name: CONTENT_ADDON_NAME,
      root: packageRoot,
      pkg: JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as PackageManifest,
      addons: [],
      contentFor(type: string): string | undefined {
        if (type === 'page-title') {
          return options.pageTitle;
        }

        if (type === 'head-footer') {
          return headFooter;
        }

        return undefined;
      }
    } satisfies EmberCliAddon
  );
}

function debugBrandPlan(
  options: ResolvedBrandAssetOptions,
  brandedPackageCount: number,
  layers: ReturnType<typeof createAssetLayers>
): void {
  if (!options.debug) return;

  console.info(`[ember-brand-bundler] Target brand: ${options.brand}`);
  console.info(`[ember-brand-bundler] Discovered branded packages: ${brandedPackageCount}`);

  layers.forEach((layer) => {
    console.info(
      `[ember-brand-bundler] ${layer.packageName} (${layer.brand}): ${layer.sourceDirectory} -> ${layer.destination}`
    );
  });
}
