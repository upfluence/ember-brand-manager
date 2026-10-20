import { getOwnConfig } from '@embroider/macros';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupIntl } from 'ember-intl/test-support';
import { setupRenderingTest } from 'ember-qunit';
import { module, test } from 'qunit';

module('Integration | Translations', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');

  test('uses the selected brand translation', async function (assert) {
    await render(hbs`{{t "ember-brand-manager.greeting"}}`);

    assert
      .dom(this.element)
      .hasText(getOwnConfig().brand === 'brand2' ? 'Brand 2 translation' : 'Default brand translation');
  });
});
