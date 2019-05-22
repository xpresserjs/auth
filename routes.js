const XpresserRouter = require('@xpresser/router');
const Route = new XpresserRouter('Auth');

Route.path('/cp', () => {

    Route.get('', 'index');

}).controller('Auth');


$.routerEngine.addToRoutes(Route);

// console.log($.routerEngine.allRoutes());
