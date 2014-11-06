## The Story

[TroopJS](http://troopjs.com/) is a component based JavaScript framework for building scalable application;

[React](http://facebook.github.io/react/) is a JavaScript library primarily focus on building on building user interfaces in innovative way;

While both are standalone libraries that can work independently, this module is intended to create hybrid solution that join the best
of both which gives developer an end-to-end solution for building web components, here's how:

TroopJS features a completely self-declarative component and provides solid mechanism for cross-component communications
within the entire component system, through either DOM events bubbling or the event hub in a completely asynchronous way.

React component is instead focus on just the UI which provides a ultra-high-performance Virtual DOM based, one-way data binding alike
rendering engine, that makes only the minimal changes required to reflect the data changes on UI.

In similarity, both React and TroopJS has a first-class component composed of declarative properties describing the component behaviors,
and both components have lifecycle event when the component is instantiated,  rendered, removed, and destroyed.

Taking the example that if we would like to create a **ticker** component using both library for comparison:

Firstly a TroopJS [widget](http://troopjs.com/docs/dom.html) would looks like:

```js
Widget.extend(function(element, name, initialTick) {
  this.tick = initialTick;
}, {
  "sig/start": function() {
    this.interval = setInterval(this.ticking.bind(this), 1000);
  },
  "sig/render": function() {
    this.html('<p>Elapsed: ' + this.tick + ' seconds.</p>');
  },
  "sig/stop": function() {
    clearInterval(this.interval);
  },
  "ticking": function() {
    ++this.tick;
    this.signal('render');
  }
});
```
And the HTML to bootstrap the widget:

```html
<body><div data-weave="ticker(1)"></div></body>
```
The same component built in React using [JSX](http://facebook.github.io/react/docs/jsx-in-depth.html) would be:

```jsx
/** @jsx React.DOM */

var Ticker = React.createClass({
  getInitialState: function() {
    return {tick: this.props.start};
  },
  componentWillMount: function() {
    this.interval = setInterval(this.ticking.bind(this), 1000);
  },
  componentWillUnmount: function() {
    clearInterval(this.interval);
  },
  ticking: function(event) {
    var tick = this.state.tick;
    this.setState({tick: ++tick});
  },
  render: function() {
    return (
      <p>Elapsed {this.state.tick} seconds.</p>
    );
  }
});

React.renderComponent(
  <Ticker start={1} />,
  document.body
);
```

Now as we have two versions, we see some common aspects that are shared between both components:
  * both components are attached to a DOM element
  * both allows for passing component's initial properties when instantiating the component;
  * both has lifecycle methods that is hooked into when the component is mounted/started and stopped/unmounted;
  * both provides a delegated method for updating the associated DOM element's internal

While under the neath the major difference is how the component's ticking interval **updates the DOM**:
  * the TroopJS widget's `sig/render` method that calls the `html` function on widget is just delegated to jQuery for DOM manipulation, the ticking
interval send each time the 'render' signal and widget re-render the entire innerHTML of the widget;
  * the React component's `render` method instead returns a Virtual DOM tree, based on what refers to as the component's **state**,
it is we call the `setState` method with the updated tick that triggers the re-render, but internally React computes the state changes that actually
take place and commit the changes to **only the minimal portion of DOM** that are subjected to be changed to keep the UI completed in sync;

Say now that we want to bring one more piece of feature to our ticker, say let's add some **pause/resume control** for ticking, we ends up with
the following changes to the above two approaches:

Firstly an updated version of the ticker widget, where a button as is included as another widget that controls the ticking, and since we cannot just
flush the inner HTML, the `ticking` function is now manipulating the ticker using jQuery instead, most significantly, two new methods
"hub/ticker/pause" and "hub/ticker/resume" are added to receive **hub messages** from the `ticker-control` widget in an loosely coupled way,
it exemplified the hub messages mechanism we have mentioned before.

```js
Widget.extend(function(element, name, initialTick) {
    this.tick = initialTick;
  }, {
    "sig/start": function() {
      var me = this;
      me.signal('render').then(function(){
        me.interval = setInterval(me.ticking.bind(me), 1000);
        me.isTicking = true;
      });
    },
    "sig/render": function() {
      this.html(
      '<p>Elapsed: <span class="ticking">' + this.tick + '</span> seconds.' +
        '<span data-weave="troopjs-ticker/widget/ticker-control(true)"></span>' +
      '</p>'
      );
    },
    "sig/stop": function() {
      clearInterval(this.interval);
    },
    "hub/ticker/pause": function() {
      this.isTicking = false;
    },
    "hub/ticker/resume": function() {
      this.isTicking = true;
    },
    "ticking": function() {
      if (this.isTicking) {
        this.$element.find('.ticking').text(++this.tick);
      }
    }
  })
```
Then the newly added "ticker-control" widget which basically upon click publishing control message over the hub and then re-render itself.

```js
Widget.extend(function(element, name, initialState) {
    this.ticking = initialState;
  }, {
    "sig/start": function() {
      this.signal('render');
    },
    "sig/render": function() {
      var label = this.ticking ? 'Pause' : 'Resume';
      this.html('<button>' + label + '</button>');
    },
    "dom/click": function() {
      var me = this;
      me.publish('ticker/' +
      (this.ticking ? 'pause' : 'resume')).then(function updateButton() {
        me.ticking = !me.ticking;
        me.signal('render');
      });
    }
  })
```

It's not hard to build the React version of the same functionality above:

```jsx
/** @jsx React.DOM */

var TickControl = React.createClass({
  getInitialState: function() {
    return {ticking: this.props.ticking};
  },
  toggleTicking: function() {
    var ticking = this.state.ticking;
    ticking? this.props.pause() : this.props.resume();
    this.state.ticking = !ticking;
    this.forceUpdate();
  },
  render: function() {
    return (
    <button onClick={this.toggleTicking}>{this.state.ticking
    ? 'Pause'
    : 'Resume'}</button>
    );
  }
});

var Ticker = React.createClass({
  getInitialState: function() {
    return {tick: this.props.start, ticking: true};
  },
  componentWillMount: function() {
    this.interval = setInterval(this.ticking.bind(this), 1000);
  },
  componentWillUnmount: function() {
    clearInterval(this.interval);
  },
  ticking: function(event) {
    if(this.state.ticking){
      this.state.tick++;
      this.forceUpdate();
    }
  },
  pause: function() {
    this.state.ticking = false;
    this.forceUpdate();
  },
  resume: function() {
    this.state.ticking = true;
    this.forceUpdate();
  },
  render: function() {
    return (
    <p>Elapsed {this.state.tick} seconds.
      <TickControl ticking={true} pause={this.pause} resume={this.resume} />
    </p>
    );
  }
});

React.renderComponent(
  <Ticker start={1} />,
  document.body
);
```

The code above of React version looks even simpler and more straightforward in the following sense:

 * avoid creating a different module for adding one widget (tick controller)
 * custom element in JSX is more intuitive for instantiating sub widget, as it eliminate the need for creating a wrapper element in the TroopJS version
 * most importantly we have killed the manual **partial DOM update** with jQuery we did in TroopJS, React handles that ticking update transparently for us

But on the other hand however, the way how React component pause and resume ticker
looks awkward, this is caused by React doesn't propagate events upward as explained it uses a one-way data-flow.
So events on a child node require event handling on both the child and parent. as it requires the event handler to be passed
as properties to the child, such strong references create a tightly coupled parent-child relationship.
It sucks if you ever intend to change the control button to live outside of this ticker, also imagine if you have a hierarchical components tree
you will be struggling to pass event handlers deeply down to the subjected child.
TroopJS component wins out in the sense that talking to the parent ticker can be easily done through hub messages or DOM event bubbling.

## The Idea

what if we can combine the highlights of both React and TroopJS, to create a **hybrid widget** , fascinating features of this component
would be selectively inherited from the best of both:

 * component shall be constructed from a spec object as in TroopJS and React
 * properties in the spec shall be either TroopJS [specials](http://troopjs.com/docs/component.html)
   or React [specification](http://facebook.github.io/react/docs/component-specs.html)
 * component shall be created in JSX as custom element like a React component
 * all TroopJS specials on the component shall function in exactly the same way as with a regular TroopJS gadget does
 * component lifecycle shall be aligned between React and TroopJS
 * component shall be able to take an TroopJS or React mix-in


## How it works

To understand how it works we have to understand a few facts of React:

  - `var Ticker = React.createClass(...)` returns you a React class descriptor given a specification;
  - `var ticker = Ticker();` instantiate the constructor gives you just a descriptor - a lightweight representation that tells what
  the mounted component would look like, not component instance!
  - `React.renderComponent(ticker, container)` creates you a real component described by `ticker`, render the component into DOM
  in the supplied container and return a reference to the component.
  * When you render using custom component in JSX `React.renderComponent(<Ticker />)` is the short hand for combining step 2. and 3.

TroopJS component has a similar but also a bit diverged life-cycle:
  - `var Ticker = Widget.extend(...)` returns you a widget constructor given a specification;
  - `var ticker = Ticker(element, displayName);`  instantiate the widget by constructor, so far the specials component are not working;
  - `ticker.start();`  will activate the component and make all specials fully functional
  - when you declaratively **weave** a widget on HTML element like `<div data-weave="ticker"></button>` is the short hand for combing 2. and 3.

So if we hijack the constructor that React use in step 3, replacing it with a constructor that is used in step 1. of TroopJS,
will produce a TroopJS component, and luck enough since both React and TroopJS use a flatten prototype for objects, if we mix-in to the prototype
with properties, and call whatever the constructor comes from what React called as **composite component**, we will get a React alike component but
is actually Troopish.

Making this composing a bit more challenge would be the fact that since the specification object has now properties from both TroopJS and React,
but they're not supposed to be composed in the same manner, since some special methods identified by their key doesn't simply override, but all
methods of the same name are guaranteed to be called, these methods are:

 * [life-cycle methods](http://facebook.github.io/react/docs/working-with-the-browser.html#component-lifecycle) for React
 * [specials](http://troopjs.com/docs/component.html#specials) for TroopJS

Since specials in TroopJS can be distinguished from the property key, the idea is to extract all these methods to be just handled by Troop mixin and
leave the rest of them to be handled by React mixin instead.

In order for such a component to be fully functional, rember we have to **start** it in TroopJS. As the component is now completely managed
by React once been rendered in DOM, it provides various methods that are executed at specific points in component's lifecycle that we
can hook into, [componentWillMount](http://facebook.github.io/react/docs/component-specs.html#mounting-componentwillmount) is the idea time when
we want to call `component.start()` and [componentWillUnmount](http://facebook.github.io/react/docs/component-specs.html#unmounting-componentwillunmount)
is the perfect time when we want to call `component.stop()`.

## Usage Example

At this point this the surgical operation is considered as complete and let's test out this hybrid component by building the ticker component again,
check out the pretty code we end up with:

```jsx
/** @jsx React.DOM */

define(['troopjs-contrib-react/gadget/react', 'react'], function(Hybrid, React) {

  var TickControl = Hybrid.extend({
    getInitialState: function() {
      return {ticking: this.props.ticking};
    },
    toggleTicking: function() {
      var me = this;
      var ticking = me.state.ticking;
      me.publish('ticker/' + (ticking ? 'pause' : 'resume')).then(function updateButton() {
        me.state.ticking = !ticking;
        me.forceUpdate();
      });
    },
    render: function() {
      return (
      <button onClick={this.toggleTicking}>{this.state.ticking ? 'Pause' : 'Resume'}</button>
      );
    }
  });

  var Ticker = Hybrid.extend({
    getInitialState: function() {
      return {tick: this.props.start, ticking: true};
    },
    componentWillMount: function() {
      this.interval = setInterval(this.ticking.bind(this), 1000);
    },
    componentWillUnmount: function() {
      clearInterval(this.interval);
    },
    ticking: function(event) {
      if(this.state.ticking){
        this.state.tick++;
        this.forceUpdate();
      }
    },
    'hub/ticker/pause': function() {
      this.state.ticking = false;
      this.forceUpdate();
    },
    'hub/ticker/resume': function() {
      this.state.ticking = true;
      this.forceUpdate();
    },
    render: function() {
      return (
      <p>Elapsed {this.state.tick} seconds.
        <TickControl ticking={true} />
      </p>
      );
    }
  });

  React.renderComponent(
    <Ticker start={1} />,
    document.body
  );
});
```



