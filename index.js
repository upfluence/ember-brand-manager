"use strict";
const mergeTrees = require("broccoli-merge-trees");
const Funnel = require("broccoli-funnel");
const fs = require("fs");

const DEFAULT_BRAND = "default";
const DEFAULT_PAGE_TITLE = "Upfluence Software";

module.exports = {
  name: require("./package").name,
  options: {
    "@embroider/macros": {
      setOwnConfig: {
        brand: process.env.BRAND || DEFAULT_BRAND,
        brandPageTitle: process.env.BRAND_PAGE_TITLE || DEFAULT_PAGE_TITLE
      }
    }
  },

  contentFor(type) {
    const targetBrand = this.options["@embroider/macros"].setOwnConfig.brand;

    if (type === "page-title") {
      return this.options["@embroider/macros"].setOwnConfig.brandPageTitle;
    }

    if (
      type === "head-footer" &&
      targetBrand !== DEFAULT_BRAND &&
      fs.existsSync(`${this.parent.root}/brand-assets/${targetBrand}/color-scheme.json`)
    ) {
      const colors = JSON.parse(
        fs.readFileSync(`${this.parent.root}/brand-assets/${targetBrand}/color-scheme.json`, "utf8")
      );

      const formattedStyle = Object.keys(colors)
        .map((v) => {
          return `${v}: ${colors[v]};`;
        })
        .join("");

      return `<style>:root { ${formattedStyle} }</style>`;
    }
  },

  treeForPublic(tree) {
    let trees = [];
    const targetBrand = this.options["@embroider/macros"].setOwnConfig.brand;
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
  return parentPkg.keywords && parentPkg.keywords.includes("ember-engine");
}

function setPublicAssets(trees, brand, origin, isEngine) {
  debugLog(`[EBM] Funneling ${brand} assets to dist/${isEngine ? origin : "assets"}`);

  trees.push(
    new Funnel("./", {
      srcDir: `brand-assets/${brand}/public`,
      destDir: isEngine ? origin : "."
    })
  );
}

function debugLog(message) {
  if (process.env.EBM_DEBUG === "true") console.info(message);
}
