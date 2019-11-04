const PluginConfig = require("../config");
const templateVariable = PluginConfig.get('templateVariable');

/**
 *
 * @param {Xpresser.Http} http
 * @returns {*}
 */
module.exports = async (http) => {

    if (http.isLogged()) {
        http.res.locals[templateVariable] = await http.auth();
    } else {
        http.res.locals[templateVariable] = undefined;
    }

    return http.next();
};
