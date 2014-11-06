require.config({
  baseUrl: '../bower_components',
  packages: [
    {
      name: 'poly',
      location: 'poly',
      main: 'poly.js'
    },
    {
      name: 'react',
      location: 'react',
      main: 'react-with-addons.js'
    },
    {
      name: 'requirejs',
      location: 'requirejs',
      main: 'require.js'
    },
    {
      name: 'troopjs-compose',
      location: 'troopjs-compose'
    },
    {
      name: 'troopjs-core',
      location: 'troopjs-core'
    },
    {
      name: 'troopjs-log',
      location: 'troopjs-log'
    },
    {
      name: 'troopjs-util',
      location: 'troopjs-util'
    },
    {
      name: 'when',
      location: 'when',
      main: 'when.js'
    },
    {
      name: 'troopjs-react',
      location: '..'
    },
    {
      name: 'jquery',
      location: 'jquery',
      main: 'dist/jquery.js'
    },
    {
      name: 'troopjs-dom',
      location: 'troopjs-dom'
    },
    {
      name: 'troopjs-jquery',
      location: 'troopjs-jquery'
    }
  ],
  deps: [
    'when/monitor/console'
  ],
  callback: function () {
    require(['troopjs-dom/application/widget', 'jquery', 'troopjs-dom/loom/plugin'], function (App, $) {
      var app = App($('html'));
      app.start().then(function () {
        // Ensure that the React component is fully rendered
        console.assert($('.awesome').length);
      });
    });
  }
});
