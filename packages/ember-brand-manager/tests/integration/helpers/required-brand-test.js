import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { getOwnConfig } from '@embroider/macros';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | required-brand', function (hooks) {
  setupRenderingTest(hooks);

  test('Displays content for the configured brand', async function (assert) {
    await render(hbs`
      {{#if (required-brand "brand2")}}
        If brand2 is set at buildtime, brand2 content will be shown here
      {{else}}
        Default content will be displayed if condition fails
      {{/if}}
    `);

    assert
      .dom(this.element)
      .hasText(
        getOwnConfig().brand === 'brand2'
          ? 'If brand2 is set at buildtime, brand2 content will be shown here'
          : 'Default content will be displayed if condition fails'
      );
  });
});
