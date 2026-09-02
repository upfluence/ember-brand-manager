import { helper } from '@ember/component/helper';
import { getOwnConfig } from '@embroider/macros';

export default helper(function requiredBrand(positional) {
  const [brand] = positional;

  return getOwnConfig().brand === brand;
});
