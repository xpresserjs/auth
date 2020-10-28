const config = require('./config');
const XpresserRouter = require('@xpresser/router');
// Set Route Namespace
const Route = new XpresserRouter('Auth');
// get UrlPrefix
let urlPrefix = config.get('routes.urlPrefix', '');
// Add slash if missing
if (urlPrefix && urlPrefix.length && urlPrefix[0] !== '/')
    urlPrefix = '/' + urlPrefix;

/**
 * Register routes only routes.enabled config is true;
 */
if (config.get('routes.enabled')) {

    // Add url prefix to url
    Route.path((urlPrefix ? urlPrefix : '') + '/auth', () => {

        if (config.get('routes.apiOnly', false) === false) {
            Route.getMany(['=index', '@dashboard']);
        }

        Route.postMany(['@login', '@register', '@logout']);

    }).controller('Auth', true).as('auth');

}


// Add Routes
module.exports = Route;
