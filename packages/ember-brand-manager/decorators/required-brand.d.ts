import Transition from '@ember/routing/transition';
interface Constructable {
    new (...args: any[]): any;
}
export declare function requiredBrand(brand: string, fallbackRoute: string): <T extends Constructable>(BaseClass: T) => {
    new (...args: any[]): {
        [x: string]: any;
        router: any;
        beforeModel(transition: Transition): void;
    };
} & T;
export {};
//# sourceMappingURL=required-brand.d.ts.map