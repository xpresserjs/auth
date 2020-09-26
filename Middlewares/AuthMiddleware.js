const PluginConfig = require("../config");
const routes = PluginConfig.get("routes");

/*
*   Name: AuthMiddleware
*   Exports: function(x) || Object of multiple functions(x)
*   Return: true/false
*/

module.exports = {

    /**
     * Default Action for this middleware.
     * @param {Xpresser.Http} http
     * @return {*}
     */
    allow(http) {
        if (!http.isLogged()) {

            if (http.req.xhr) {
                return http.toApiFalse({error: "User is not logged"})
            }

            return http.redirectToRoute('auth');
        }

        return http.next()
    },

    /**
     * Guest Action for this middleware.
     * @param {Xpresser.Http} http
     * @return {*}
     */
    guest(http) {
        if (http.isLogged()) {

            if (http.req.xhr) {
                return http.toApiFalse({error: "User is already logged"})
            }

            return http.redirectToRoute(routes.afterLogin);
        }

        return http.next();
    },
};
