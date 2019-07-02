/**
 * Load Config from config.js
 * Using $.objectCollection
 * @type {ObjectCollection}
 */
const PluginConfig = new ($.objectCollection)(require('../config'));

// Merge with user defined configuration
PluginConfig.merge(
    $.$config.get('plugins[@xpresser/auth]', {})
);

// Import User Model
const User = $.use.model(PluginConfig.get('model'));
const Bcrypt = require("bcrypt");

class AuthController extends $.controller {

    static middleware() {
        return {
            'auth': 'dashboard',
            'auth.guest': ['index', 'login', 'register'],
        };
    }


    /**
     * Login/Auth Index
     * @param {XpresserAuth.RequestEngine} x
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
     * @param {XpresserAuth.RequestEngine} x
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

            if (Bcrypt.compareSync(
                password,
                user.password
            )) {
                logged = true;
                x.session.email = $.base64.encode(user.email);
                x.session.loginKey = $.base64.encode(Bcrypt.hashSync(user.email, 10));
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

        console.log(data);


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
        password = Bcrypt.hashSync(password, 10);

        // Setup new user data object
        const newUser = {email, password, name};

        // Inset new user data object
        await User.query().insert(newUser);

        msg = 'Registration successful, Login now!';

        x.with('reg_success', msg);
        return this.backToRequest(x, {msg}, true);
    }

    /**
     * Logout
     * @param {XpresserAuth.RequestEngine} x
     * @return {*}
     */
    logout(x) {
        // log user out.
        x.logout();

        // Return data
        x.with({logout: "Logout successful."});

        return x.redirectToRoute("auth");
    }
}

module.exports = AuthController;
