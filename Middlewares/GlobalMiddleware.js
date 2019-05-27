module.exports = async (x) => {

    if (x.isLogged()) {
        x.res.locals[$.config.auth.templateVariable] = await x.auth();
    } else {
        x.res.locals[$.config.auth.templateVariable] = undefined;
    }

    return x.next();
};