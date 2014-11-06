/** @jsx React.DOM */
define('hello', ['react', 'troopjs-react/gadget/react'], function (React, Gadget) {
  return Gadget.extend({
    mixins: [React.addons.LinkedStateMixin],
    getInitialState: function () {
      return this.props;
    },
    'sig/start': function () {
      console.log('my name', this.props.name);
    },
    render: function () {
      return (
        <div>
          <div className="awesome">
            <label htmlFor="name">your name:&nbsp;</label>
            <input type="text" id="name" valueLink={this.linkState('name')} />
          </div>
          <p>{this.state.name}</p>
        </div>
        );
    }
  });
});
