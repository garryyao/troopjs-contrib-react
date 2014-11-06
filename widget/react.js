define([
  'troopjs-dom/component/widget',
  'when',
  'react',
  'require'
], function (Widget, when, React, require) {
  return Widget.extend(function ($element, displayName, module, props) {
    this.boot = function () {
      return when.promise(function (resolve) {
        require([module], function (Component) {
          React.renderComponent(Component(props), $element.get(0), resolve);
        });
      });
    }
  }, {
    'sig/start': function reactWidgetStart() {
      return this.boot();
    }
  });
});
