const config = require('./config');
const XpresserRouter = require('@xpresser/router');
// Set Route Namespace
const Route = new XpresserRouter('Auth');

/**
 * Register routes only routes.enabled config is true;
 */
if (config.get('routes.enabled')) {

    Route.path('/auth', () => {

        if (config.get('routes.apiOnly', false) === false) {
            Route.get('=index');
            Route.get('@dashboard');
        }

        Route.post('@login');
        Route.post('@register');
        Route.all('@logout');

    }).controller('Auth', true).as('auth');

}


// Add Routes
module.exports = Route;
