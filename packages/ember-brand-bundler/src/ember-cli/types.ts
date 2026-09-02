export interface PackageManifest {
  name?: string;
  version?: string;
  keywords?: unknown;
  root?: string;
  [key: string]: unknown;
}

export interface EmberCliAddon {
  name?: string;
  root?: string;
  pkg?: PackageManifest;
  addons?: EmberCliAddon[];
  [key: string]: unknown;
}

export interface EmberCliProject {
  root: string;
  pkg: PackageManifest;
  addons: EmberCliAddon[];
  configPath(): string;
}

export interface EmberCliApplication {
  project: EmberCliProject;
  trees: {
    public?: unknown;
    [key: string]: unknown;
  };
  toTree(...args: never[]): unknown;
}
