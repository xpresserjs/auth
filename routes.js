const XpresserRouter = require('@xpresser/router');
const Route = new XpresserRouter('Auth');

Route.path('/auth', () => {
    Route.get('', 'index');
    Route.get('@dashboard');

    Route.post('@login');
    Route.post('@register');
    Route.all('@logout');
}).controller('Auth', true).as('auth');

$.routerEngine.addToRoutes(Route);

// console.log($.routerEngine.allRoutes());
