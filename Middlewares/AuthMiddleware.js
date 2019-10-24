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
     * @param {XpresserHttp.Engine} x
     * @return {*}
     */
    allow(x) {
        if (!x.isLogged()){

            if(x.req.xhr){
                return  x.toApiFalse({msg: "User is not logged"})
            }

            return x.redirectToRoute('auth');
        }

        return x.next()
    },


    guest(x) {
        if (x.isLogged()){

            if(x.req.xhr){
                return  x.toApiFalse({msg: "User is already logged"})
            }

            return x.redirectToRoute(routes.afterLogin);
        }

        return x.next();
    },
};
