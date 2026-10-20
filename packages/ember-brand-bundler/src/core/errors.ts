export class BrandBundlerError extends Error {
  constructor(message: string) {
    super(`[ember-brand-bundler] ${message}`);
    this.name = 'BrandBundlerError';
  }
}
