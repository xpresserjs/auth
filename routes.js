const {PluginConfig} = require('./config');
const XpresserRouter = require('@xpresser/router');
// Set Route Namespace
const Route = new XpresserRouter('Auth');
// get UrlPrefix
let urlPrefix = PluginConfig.get('routes.urlPrefix', '');
// Add slash if missing
if (urlPrefix && urlPrefix.length && urlPrefix[0] !== '/')
    urlPrefix = '/' + urlPrefix;

/**
 * Register routes only routes.enabled config is true;
 */
if (PluginConfig.get('routes.enabled')) {

    // Add url prefix to url
    Route.path((urlPrefix ? urlPrefix : '') + '/auth', () => {

        if (PluginConfig.get('routes.apiOnly', false) === false) {
            Route.getMany(['=index', '@dashboard']);
        }

        Route.postMany(['@login', '@register', '@logout']);

    }).controller('Auth', true).as('auth');

}


// Add Routes
module.exports = Route;
