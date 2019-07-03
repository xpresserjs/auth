const PluginConfig = require("../config");
const templateVariable = PluginConfig.get('templateVariable');

module.exports = async (x) => {

    if (x.isLogged()) {
        x.res.locals[templateVariable] = await x.auth();
    } else {
        x.res.locals[templateVariable] = undefined;
    }

    return x.next();
};
