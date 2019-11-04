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
     * @param {Xpresser.Http} http
     * @return {*}
     */
    index(http) {
        const data = {
            action: http.query("action", "login")
        };

        const view = PluginConfig.get('views.index');

        let usingEjs = true;

        if (view !== 'auth::index') {
            usingEjs = PluginConfig.get('usingEjs');
        }

        return http.view(view, data, false, usingEjs);
    }


    /**
     * Dashboard after Login
     * @param {Xpresser.Http} http
     * @return {void | Response }
     */
    dashboard(http) {
        const view = PluginConfig.get('views.dashboard');

        let usingEjs = true;
        if (view !== 'auth::dashboard') {
            usingEjs = PluginConfig.get('usingEjs', true);
        }

        return http.view(view, {}, false, usingEjs);
    }

    /**
     * Login
     * @param {Xpresser.Http} http
     * @return {Promise<*>}
     */
    async login(http) {
        const loginConfig = PluginConfig.get('login');

        const email = http.body(loginConfig.email, false);
        const password = http.body(loginConfig.password, false);

        const errorMsg = "Incorrect Email/Password combination!";
        let logged = false;

        if (!email || !password) {
            http.with("login_error", errorMsg);
            return this.backToRequest(http, errorMsg, false)
        }


        const user = await User.query()
            .where({email})
            .first();


        if (user === undefined) {

            http.with("login_error", errorMsg);

        } else {

            if (bcrypt.compareSync(
                password,
                user.password
            )) {
                logged = true;

                // Log User In
                await http.loginUser(email);
                // Emit User Logged In Event
                $.events.emit(
                    PluginConfig.get('events.userLoggedIn'),
                    http,
                    user
                );

                http.with("login", "Login successful. Welcome to your dashboard!");
            } else {
                http.with("login_error", errorMsg);
            }

        }

        // If is xhr request then return json.
        // noinspection JSUnresolvedVariable
        if (http.req.xhr) {
            return http.toApi({
                logged,
                msg: logged ? 'Login Successful.' : errorMsg,
            }, logged);
        }

        return http.redirectToRoute(
            logged ?
                PluginConfig.get('routes.afterLogin') :
                PluginConfig.get('routes.login')
        );
    }

    /**
     *
     * @param {Xpresser.Http} http
     * @param data
     * @param proceed
     * @return {*}
     */
    backToRequest(http, data, proceed) {

        const returnCode = proceed ? 200 : 400;
        if (typeof data === "string") {
            data = {msg: data};
        }

        if (http.req.xhr) {
            return http.toApi(data, proceed, returnCode);
        }

        http.res.status(returnCode);

        return http.with(data).withOld().redirectBack();
    };

    /**
     * Register
     * @param {Xpresser.Http} http
     * @return {Promise<void>}
     */
    async register(http) {
        const regConfig = PluginConfig.get('register');

        const email = http.body(regConfig.email, false);

        if (!email) {
            return this.backToRequest(http, `Email not found.`, false)
        }

        let password = http.body(regConfig.password, false);

        if (!password) {
            return this.backToRequest(http, `Password not found.`, false)
        }

        let name = http.body(regConfig.name, false);

        if (!name) {
            return this.backToRequest(http, `Name not found.`, false)
        }

        const user = await User.query()
            .where({email})
            .first();

        // User Exists
        let msg = "Email has an account already.";
        if (user !== undefined) {
            http.with("reg_error", msg);
            return this.backToRequest(http, {msg}, false);
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
            http,
            RegisteredUser
        );


        msg = 'Registration successful, Login now!';

        http.with('reg_success', msg);
        return this.backToRequest(http, {msg}, true);
    }

    /**
     * Logout
     * @param {Xpresser.Http} http
     * @return {*}
     */
    logout(http) {


        if (http.isLogged()) {
            const user = http.authUser();

            // log user out.
            http.logout();

            // Emit Event
            $.events.emit(PluginConfig.get('events.userLoggedOut'), http, user);

        }

        // Return data
        http.with({logout: "Logout successful."});

        return http.redirectToRoute("auth");
    }
}

module.exports = AuthController;
