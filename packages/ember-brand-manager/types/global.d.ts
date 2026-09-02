// Types for compiled templates
declare module '@upfluence/ember-brand-manager/templates/*' {
  import { TemplateFactory } from 'ember-cli-htmlbars';

  const tmpl: TemplateFactory;
  export default tmpl;
}
