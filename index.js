'use strict';
const mergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const fs = require('fs');

const DEFAULT_BRAND = 'default';
const DEFAULT_PAGE_TITLE = 'Upfluence Software';

module.exports = {
  name: require('./package').name,
  options: {
    '@embroider/macros': {
      setOwnConfig: {
        brand: process.env.BRAND || DEFAULT_BRAND,
        brandPageTitle: process.env.BRAND_PAGE_TITLE || DEFAULT_PAGE_TITLE
      }
    },
    babel: {
      plugins: [...require('ember-cli-code-coverage').buildBabelPlugin()],
    }
  },

  contentFor(type) {
    const targetBrand = this.options['@embroider/macros'].setOwnConfig.brand;

    if (type === 'page-title') {
      return this.options['@embroider/macros'].setOwnConfig.brandPageTitle;
    }

    return colorSchemeStyle(targetBrand, this.parent.root, type);
  },

  treeForPublic(tree) {
    let trees = [];
    const targetBrand = this.options['@embroider/macros'].setOwnConfig.brand;
    const ebmCandidates = this.parent.addons
      .map((addon) => addon.addons)
      .flat()
      .filter((parentAddon) =>
        parentAddon.addons.find((addon) => addon.pkg.name.includes('@upfluence/ember-brand-manager'))
      )
      .reduce(
        (acc, addon) => {
          acc.push({ pkgName: addon.name, isAddon: true, srcDir: addon.pkg.root });
          return acc;
        },
        [{ pkgName: this.parent.pkg.name, isAddon: checkIfAddon(this.parent.pkg) }]
      );

    if (tree) {
      trees.push(tree);
    }

    debugLog(`\n[EBM] Target brand : [${targetBrand}]`);

    ebmCandidates.forEach((ebmCandidate) => {
      debugLog(`[EBM] Pkg name : [${ebmCandidate.pkgName}]`);

      this.setPublicAssets(trees, DEFAULT_BRAND, ebmCandidate.pkgName, ebmCandidate.isAddon, ebmCandidate.srcDir);

      if (targetBrand !== DEFAULT_BRAND) {
        this.setPublicAssets(trees, targetBrand, ebmCandidate.pkgName, ebmCandidate.isAddon, ebmCandidate.srcDir);
      }
    });

    return mergeTrees(trees, { overwrite: true });
  },

  setPublicAssets(trees, brand, origin, isAddon, srcDir) {
    debugLog(`[EBM] Funneling ${brand} assets to dist/${isAddon ? origin : 'assets'}`);

    const _srcDir = srcDir ?? (isAddon ? this.parent.pkg.root : './');
    const destDir = isAddon ? origin : '.';

    trees.push(
      new Funnel(_srcDir, {
        srcDir: `brand-assets/${brand}/public`,
        destDir
      })
    );
  }
};

function checkIfAddon(parentPkg) {
  return parentPkg.keywords && parentPkg.keywords.includes('ember-addon');
}

function colorSchemeStyle(targetBrand, root, type) {
  if (
    type === 'head-footer' &&
    targetBrand !== DEFAULT_BRAND &&
    fs.existsSync(`${root}/brand-assets/${targetBrand}/color-scheme.json`)
  ) {
    const colors = JSON.parse(fs.readFileSync(`${root}/brand-assets/${targetBrand}/color-scheme.json`, 'utf8'));

    const formattedStyle = Object.keys(colors)
      .map((v) => {
        return `${v}: ${colors[v]};`;
      })
      .join('');

    debugLog(`[EBM] Color Scheme: ${formattedStyle}`);

    return `<style>:root { ${formattedStyle} }</style>`;
  }
}

function debugLog(message) {
  if (process.env.EBM_DEBUG === 'true') console.info(message);
}
