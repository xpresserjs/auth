/**
 * Load Config from config.js
 * @type {ObjectCollection}
 */
const PluginConfig = require('../config');

// Import User Model
const User = $.use.model(PluginConfig.get('model'));
const bcrypt = require("bcryptjs");

class AuthController extends $.controller {

    static middleware() {
        return {
            'auth': 'dashboard',
            'auth.guest': ['index', 'login', 'register'],
        };
    }


    /**
     * Login/Auth Index
     * @param {XpresserHttp.Engine} x
     * @return {*}
     */
    index(x) {
        const data = {
            action: x.query("action", "login")
        };

        const view = PluginConfig.get('views.index');

        let usingEjs = true;

        if (view !== 'auth::index') {
            usingEjs = PluginConfig.get('usingEjs');
        }

        return x.view(view, data, false, usingEjs);
    }


    /**
     * Dashboard after Login
     * @param {XpresserHttp.Engine} x
     * @return {void | Response }
     */
    dashboard(x) {
        const view = PluginConfig.get('views.dashboard');

        let usingEjs = true;
        if (view !== 'auth::dashboard') {
            usingEjs = PluginConfig.get('usingEjs', true);
        }

        return x.view(view, {}, false, usingEjs);
    }

    /**
     * Login
     * @param {XpresserHttp.Engine} x
     * @return {Promise<*>}
     */
    async login(x) {
        const loginConfig = PluginConfig.get('login');

        const email = x.body(loginConfig.email, false);
        const password = x.body(loginConfig.password, false);

        const errorMsg = "Incorrect Email/Password combination!";
        let logged = false;

        if (!email || !password) {
            x.with("login_error", errorMsg);
            return this.backToRequest(x, errorMsg, false)
        }


        const user = await User.query()
            .where({email})
            .first();


        if (user === undefined) {

            x.with("login_error", errorMsg);

        } else {

            if (bcrypt.compareSync(
                password,
                user.password
            )) {
                logged = true;

                // Log User In
                await x.loginUser(email);
                // Emit User Logged In Event
                $.events.emit(
                    PluginConfig.get('events.userLoggedIn'),
                    x,
                    user
                );

                x.with("login", "Login successful. Welcome to your dashboard!");
            } else {
                x.with("login_error", errorMsg);
            }

        }

        // If is xhr request then return json.
        // noinspection JSUnresolvedVariable
        if (x.req.xhr) {
            return x.toApi({
                logged,
                msg: logged ? 'Login Successful.' : errorMsg,
            }, logged);
        }

        return x.redirectToRoute(
            logged ?
                PluginConfig.get('routes.afterLogin') :
                PluginConfig.get('routes.login')
        );
    }

    /**
     *
     * @param {XpresserHttp.Engine} x
     * @param data
     * @param proceed
     * @return {*}
     */
    backToRequest(x, data, proceed) {

        const returnCode = proceed ? 200 : 400;
        if (typeof data === "string") {
            data = {msg: data};
        }

        if (x.req.xhr) {
            return x.toApi(data, proceed, returnCode);
        }

        x.res.status(returnCode);

        return x.with(data).withOld().redirectBack();
    };

    /**
     * Register
     * @param {XpresserHttp.Engine} x
     * @return {Promise<void>}
     */
    async register(x) {
        const regConfig = PluginConfig.get('register');

        const email = x.body(regConfig.email, false);

        if (!email) {
            return this.backToRequest(x, `Email not found.`, false)
        }

        let password = x.body(regConfig.password, false);

        if (!password) {
            return this.backToRequest(x, `Password not found.`, false)
        }

        let name = x.body(regConfig.name, false);

        if (!name) {
            return this.backToRequest(x, `Name not found.`, false)
        }

        const user = await User.query()
            .where({email})
            .first();

        // User Exists
        let msg = "Email has an account already.";
        if (user !== undefined) {
            x.with("reg_error", msg);
            return this.backToRequest(x, {msg}, false);
        }

        // Encrypt User Password
        password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

        // Setup new user data object
        const newUser = {email, password, name};

        // Inset new user data object
        const RegisteredUser = await User.query().insert(newUser);
        // Emit Event
        $.events.emit(
            PluginConfig.get('events.userRegistered'),
            x,
            RegisteredUser
        );


        msg = 'Registration successful, Login now!';

        x.with('reg_success', msg);
        return this.backToRequest(x, {msg}, true);
    }

    /**
     * Logout
     * @param {XpresserHttp.Engine} x
     * @return {*}
     */
    logout(x) {

        if (x.isLogged()) {
            const user = x.authUser();

            // log user out.
            x.logout();

            // Emit Event
            $.events.emit(PluginConfig.get('events.userLoggedOut'), x, user);

        }

        // Return data
        x.with({logout: "Logout successful."});

        return x.redirectToRoute("auth");
    }
}

module.exports = AuthController;
