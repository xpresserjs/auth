/*
*   Name: AuthMiddleware
*   Exports: function(x) || Object of multiple functions(x)
*   Return: true/false
*/

module.exports = {

    /**
     * Default Action for this middleware.
     * @param {RequestEngine} x
     * @return {*}
     */
    allow(x) {
        if (!x.isLogged()){
            return x.redirectToRoute('auth');
        }

        return x.next()
    },


    guest(x) {
        if (x.isLogged()){
            return x.redirectToRoute($.config.auth.routeAfterLogin);
        }

        return x.next();
    },
};