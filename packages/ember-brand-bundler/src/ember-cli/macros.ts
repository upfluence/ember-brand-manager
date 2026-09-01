import { join, resolve } from 'node:path';

import { MacrosConfig } from '@embroider/macros/src/node';

import { BrandBundlerError, type BrandedPackage } from '../core/index.js';
import type { EmberCliApplication } from './types.js';

const RUNTIME_PACKAGE_NAME = '@upfluence/ember-brand-manager';

export function configureBrandedPackages(
  app: EmberCliApplication,
  brandedPackages: readonly BrandedPackage[],
  brand: string
): void {
  if (!brandedPackages.some(({ name }) => name === RUNTIME_PACKAGE_NAME)) {
    throw new BrandBundlerError(`Could not find ${RUNTIME_PACKAGE_NAME} among the branded packages.`);
  }

  const macrosConfig = MacrosConfig.for(app, resolve(app.project.configPath(), '..', '..'));

  brandedPackages.forEach((brandedPackage) => configureBrandedPackage(macrosConfig, brandedPackage, brand));
}

function configureBrandedPackage(
  macrosConfig: MacrosConfig,
  brandedPackage: BrandedPackage,
  brand: string
): void {
  const packageManifest = join(brandedPackage.root, 'package.json');

  try {
    macrosConfig.setOwnConfig(packageManifest, { brand });
  } catch (error) {
    throw new BrandBundlerError(
      `Unable to configure branded package ${brandedPackage.name}: ${error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
