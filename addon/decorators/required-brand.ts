import { getOwnConfig } from '@embroider/macros';
import { assert } from '@ember/debug';
import { inject as service } from '@ember/service';

interface Constructable {
  new (...args: any[]): any;
}

export function requiredBrand(brand: string, fallbackRoute: string) {
  return function extendClass<T extends Constructable>(BaseClass: T) {
    return class extends BaseClass {
      // @ts-ignore;
      @service declare router;

      beforeModel() {
        assert(
          '[EBM][Decorators][requiredBrand] The @brand parameter of type string is mandatory',
          typeof brand === 'string'
        );
        assert(
          '[EBM][Decorators][requiredBrand] The @fallbackRoute parameter of type string is mandatory',
          typeof fallbackRoute === 'string'
        );
        if ((getOwnConfig() as any).brand !== brand) {
          this.router.transitionTo(fallbackRoute);
        }
      }
    }
  };
}
