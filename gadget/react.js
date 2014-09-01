define([
  'troopjs-core/component/gadget',
  'react'
], function(Gadget, React) {

  var CompositeComponent = React.__internals.ReactCompositeComponent;
  var Base = CompositeComponent.Base;

  var SPECIAL_SIG = /^(\w+)(?::(.+?))?\/(.+)/;

  // Extract all properties to be mixed into by React if it is not TroopJS specials
  function extract(spec) {
    var retval = {};
    Object.getOwnPropertyNames(spec).forEach(function(name) {
      if (!SPECIAL_SIG.test(name)) {
        retval[name] = spec[name];
        delete spec[name];
      }
    });
    return retval;
  }

  /**
   * overload Component.extend/create to make hybrid components
   * share the same signature with {@link troopjs-compose/mixin/factory}
   */
  function hybridExtend(spec) {
    var mixins = [];
    // extract React life-cycle methods to be mixed in later
    Array.prototype.forEach.call(arguments, function(arg) {
      // if it is a spec rather than a constructor
      if (typeof arg === 'object') {
        mixins.push(extract(arg));
      }
    });

    mixins.push({
      componentDidMount: function() {
        this.start();
      },
      componentWillUnmount: function() {
        this.stop();
      }
    });

    var args = Array.prototype.slice.call(arguments);
    args.push(function(props, owner) {
      this.construct(props, owner);
    }, Base.prototype);

    var hybrid = Gadget.extend.apply(Gadget, args);
    mixins.forEach(function(mixin) {
      CompositeComponent.mixInto(hybrid, mixin);
    });
    return React.createClass({}, hybrid);
  }

  return {
    'extend': hybridExtend,
    'create': function() {
      return hybridExtend.apply(this, arguments)();
    }
  };
});
