import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import { requiredBrand } from '@upfluence/ember-brand-manager/decorators/required-brand';

module('Unit | Decorators | @requiredBrand', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.routerStub = { transitionTo: sinon.stub(), currentURL: 'account/social-medias' };
    this.transitionStub = { abort: sinon.stub(), to: { name: 'route' }, targetName: 'route' };
  });

  test('The decorator is defined', function (assert) {
    assert.ok(requiredBrand);
  });

  test('The decorator extends the target class with a new beforeModel method', function (assert) {
    class TestWithoutDecorator {}

    @requiredBrand()
    class TestWithDecorator {}

    const testDecorator = new TestWithDecorator();
    assert.ok(testDecorator.beforeModel);
    const testWithoutDecorator = new TestWithoutDecorator();
    assert.notOk(testWithoutDecorator.beforeModel);
  });

  test('If the brand parameter is not passed, an error is thrown', function (assert) {
    assert.expect(1);
    @requiredBrand(null, '')
    class TestClass {}
    const test = new TestClass();
    try {
      test.beforeModel();
    } catch (error) {
      assert.strictEqual(
        error.message,
        'Assertion Failed: [EBM][Decorators][requiredBrand] The @brand parameter of type string is mandatory'
      );
    }
  });

  test('If the fallbackRoute parameter is not passed, an error is thrown', function (assert) {
    assert.expect(1);
    @requiredBrand('brand2')
    class TestClass {}
    const test = new TestClass();
    try {
      test.beforeModel();
    } catch (error) {
      assert.strictEqual(
        error.message,
        'Assertion Failed: [EBM][Decorators][requiredBrand] The @fallbackRoute parameter of type string is mandatory'
      );
    }
  });

  test('If the brand does not match the one set at buildtime, the user will be redirected to the fallbackRoute', function (assert) {
    @requiredBrand('brand2', 'fallbackRoute')
    class TestClass {}
    const test = new TestClass();
    test.router = this.routerStub;
    test.beforeModel();
    assert.true(this.routerStub.transitionTo.calledOnceWith('fallbackRoute'));
  });

  test('If the brand matches the one set at buildtime, no router transition occurs', function (assert) {
    @requiredBrand('default', 'fallbackRoute')
    class TestClass {}
    const test = new TestClass();
    test.router = this.routerStub;
    assert.true(this.routerStub.transitionTo.notCalled);
  });
});
