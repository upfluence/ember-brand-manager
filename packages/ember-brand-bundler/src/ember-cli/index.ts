import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import Funnel from 'broccoli-funnel';
import mergeTrees from 'broccoli-merge-trees';

import {
  BrandBundlerError,
  createAssetLayers,
  createTranslationLayers,
  DEFAULT_BRAND,
  renderBrandContent,
  resolveBrandOptions,
  resolveBrandedPackages,
  type BrandAssetOptions,
  type ResolvedBrandAssetOptions,
  type TranslationLayer
} from '../core/index';
import { discoverBrandedPackageCandidates } from './discovery';
import { configureBrandedPackages } from './macros';
import type { EmberCliAddon, EmberCliApplication, PackageManifest } from './types';

const BUILD_ADDON_NAME = '@upfluence/ember-brand-bundler';

export type { BrandAssetOptions } from '../core/index';

// Keep brand planning independent of Ember CLI so additional build adapters can reuse it.
export function withBrandAssets<T extends EmberCliApplication>(app: T, options?: BrandAssetOptions): T {
  const resolvedOptions = resolveBrandOptions(options);
  const brandedPackages = resolveBrandedPackages(discoverBrandedPackageCandidates(app));
  const assetLayers = createAssetLayers(brandedPackages, resolvedOptions.brand);
  const translationLayers = createTranslationLayers(brandedPackages, resolvedOptions.brand);
  const headFooter = renderBrandContent('head-footer', resolvedOptions);

  assertEmberIntl(app, translationLayers);
  configureBrandedPackages(app, brandedPackages, resolvedOptions.brand);
  attachPublicTrees(app, assetLayers);
  registerBuildAddon(app, resolvedOptions, headFooter, translationLayers);
  debugBrandPlan(resolvedOptions, brandedPackages.length, assetLayers, translationLayers);

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
  * In case you're wondering... yes! we're programmatically creating an Ember CLI addon because Ember applications do
  * not expose contentFor or treeForTranslations hooks themselves.
*/
function registerBuildAddon(
  app: EmberCliApplication,
  options: ResolvedBrandAssetOptions,
  headFooter: string | undefined,
  translationLayers: readonly TranslationLayer[]
): void {
  const packageRoot = resolve(__dirname, '..', '..');
  app.project.addons.push(
    {
      name: BUILD_ADDON_NAME,
      root: packageRoot,
      pkg: JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')) as PackageManifest,
      addons: [],
      ...(translationLayers.length === 0
        ? {}
        : {
          treeForTranslations(tree: unknown): unknown {
            return mergeTrees(
              [
                tree,
                ...translationLayers.map(
                  (layer, index) =>
                    Funnel(layer.sourceDirectory, {
                      include: ['**/*.yml', '**/*.yaml'],
                      destDir: translationDestination(layer, index),
                      allowEmpty: true
                    })
                )
              ].filter(Boolean) as Parameters<typeof mergeTrees>[0],
              { overwrite: true }
            );
          }
        }),
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

function assertEmberIntl(app: EmberCliApplication, translationLayers: readonly TranslationLayer[]): void {
  if (
    translationLayers.length > 0 &&
    !app.project.addons.some((addon) => addon.name === 'ember-intl' || addon.pkg?.name === 'ember-intl')
  ) {
    throw new BrandBundlerError(
      'Branded translations require the host application to include ember-intl as a direct dependency.'
    );
  }
}

function translationDestination(layer: TranslationLayer, index: number): string {
  return `translations/${layer.brand === DEFAULT_BRAND ? '0-default' : '1-override'}/${String(index).padStart(6, '0')}`;
}

function debugBrandPlan(
  options: ResolvedBrandAssetOptions,
  brandedPackageCount: number,
  assetLayers: ReturnType<typeof createAssetLayers>,
  translationLayers: ReturnType<typeof createTranslationLayers>
): void {
  if (!options.debug) return;

  console.info(`[ember-brand-bundler] Target brand: ${options.brand}`);
  console.info(`[ember-brand-bundler] Discovered branded packages: ${brandedPackageCount}`);

  assetLayers.forEach((layer) => {
    console.info(
      `[ember-brand-bundler] asset ${layer.packageName} (${layer.brand}): ${layer.sourceDirectory} -> ${layer.destination}`
    );
  });

  translationLayers.forEach((layer, index) => {
    console.info(
      `[ember-brand-bundler] translation ${layer.packageName} (${layer.brand}): ${layer.sourceDirectory} -> ${translationDestination(layer, index)}`
    );
  });
}
