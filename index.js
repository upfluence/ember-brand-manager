'use strict';
const DEFAULT_BRAND = 'default';
const mergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');

module.exports = {
  name: require('./package').name,
  options: {
    '@embroider/macros': {
      setOwnConfig: {
        brand: process.env.BRAND || DEFAULT_BRAND
      }
    }
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

    setPublicAssets(trees, DEFAULT_BRAND, pkgName, isEngine);
    if (targetBrand !== DEFAULT_BRAND) {
      setPublicAssets(trees, targetBrand, pkgName, isEngine);
    }

    return mergeTrees(trees, { overwrite: true });
  }
};

function checkIfEngine(parentPkg) {
  if (parentPkg.keywords && parentPkg.keywords.includes('ember-engine'))
    return true;
  return false;
}

function setPublicAssets(trees, brand, origin, isEngine) {
  debugLog(`[EBM] Funneling ${brand} assets to dist/${isEngine ? origin : 'assets'}`);

  trees.push(
    new Funnel('./', {
      srcDir: `brand-assets/${brand}/public`,
      destDir: isEngine ? origin : '.'
    })
  );
}

function debugLog(message) {
  if (process.env.EBM_DEBUG === 'true') console.info(message);
}
