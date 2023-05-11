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
    const pkgName = this.parent.pkg.name;
    const isEngine = checkIfEngine(this.parent.pkg);

    debugLog(`\n[EBM] Target brand : [${targetBrand}]`);
    debugLog(`[EBM] Parent pkg name : [${pkgName}]`);
    if (tree) {
      trees.push(tree);
    }

    this.setPublicAssets(trees, DEFAULT_BRAND, pkgName, isEngine);

    if (targetBrand !== DEFAULT_BRAND) {
      this.setPublicAssets(trees, targetBrand, pkgName, isEngine);
    }

    return mergeTrees(trees, { overwrite: true });
  },

  setPublicAssets(trees, brand, origin, isEngine) {
    debugLog(`[EBM] Funneling ${brand} assets to dist/${isEngine ? origin : 'assets'}`);

    if (isEngine) {
      console.log('<<<', origin, this.parent.pkg.root);
    }

    const srcDir = isEngine ? this.parent.pkg.root : './';
    const destDir = isEngine ? origin : '.';

    trees.push(
      new Funnel(srcDir, {
        srcDir: `brand-assets/${brand}/public`,
        destDir
      })
    );
  }
};

function checkIfEngine(parentPkg) {
  return parentPkg.keywords && parentPkg.keywords.includes('ember-engine');
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
