/**
 * Load Config from config.js
 * @type {ObjectCollection}
 */
const PluginConfig = require('../config');
const UserPasswordProvider = PluginConfig.get('userPasswordProvider');
const UserDataProvider = PluginConfig.get('userDataProvider');
const UserRegistrationHandler = PluginConfig.get('userRegistrationHandler');
const UserLoginValidator = PluginConfig.get('userLoginValidator');


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
            action: http.query("action", "login"),
        };

        if (data.action === 'register') {
            data['form'] = PluginConfig.get('register')
        } else {
            data['form'] = PluginConfig.get('login')
        }

        const view = PluginConfig.get('views.index');

        let usingEjs = true;

        if (view !== 'auth::index') {
            usingEjs = PluginConfig.get('usingEjs', usingEjs);
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
        if (typeof User[UserPasswordProvider] !== "function") {
            throw Error(`Method {${UserPasswordProvider}} does not exits in defined Auth Model."`)
        }

        const loginConfig = PluginConfig.get('login');
        const modelPrimaryKey = PluginConfig.get('modelPrimaryKey');

        const primaryKeyValue = http.body(loginConfig.primaryKey, false);
        const password = http.body(loginConfig.password, false);

        let errorMessage = "Incorrect Email/Password combination!";
        let logged = false;

        if (!primaryKeyValue || !password) {
            http.with("login_error", errorMessage);
            return this.backToRequest(http, errorMessage, false)
        }

        let user_password = await User[UserPasswordProvider](primaryKeyValue, modelPrimaryKey);

        if (!user_password) {

            http.with("login_error", errorMessage);

        } else {

            if (bcrypt.compareSync(
                password,
                user_password
            ) === false) {
                logged = true;
                let validatorResult = null;

                if (typeof User[UserLoginValidator] === "function") {
                    validatorResult = await User[UserLoginValidator](primaryKeyValue, http)

                    if (typeof validatorResult !== "object") {
                        throw TypeError(`Login Validator must return type object`);
                    }

                    const keysInResult = Object.keys(validatorResult);

                    if (!keysInResult.includes('error') || !keysInResult.includes('proceed')) {
                        throw TypeError(`Login Validator must return type object {error: boolean|string, proceed: boolean}`);
                    }

                    if (!validatorResult.proceed)
                        return;

                    if (validatorResult.error) {
                        errorMessage = validatorResult.error;
                        logged = false;
                    }
                }

                if (logged) {
                    // Log User In
                    await http.loginUser(primaryKeyValue);
                    // Emit User Logged In Events
                    $.events.emit(
                        PluginConfig.get('events.userLoggedIn'),
                        http,
                        primaryKeyValue
                    );

                    http.with("login", "Login successful. Welcome to your dashboard!");
                } else {
                    http.with("login_error", errorMessage);
                }

            } else {
                http.with("login_error", errorMessage);
            }

        }

        // If is xhr request then return json.
        // noinspection JSUnresolvedVariable
        if (http.req.xhr) {
            return http.toApi({
                logged,
                message: logged ? 'Login Successful.' : errorMessage,
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
            data = {message: data};
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

        if (typeof User[UserDataProvider] !== "function") {
            throw new Error(`Method {${UserDataProvider}} does not exits in defined Auth Model."`)
        }

        if (typeof User[UserRegistrationHandler] !== "function") {
            throw new Error(`Method {${UserRegistrationHandler}} does not exits in defined Auth Model."`)
        }

        const regConfig = PluginConfig.get('register');
        const modelPrimaryKey = PluginConfig.get('modelPrimaryKey');

        const primaryKeyValue = http.body(regConfig.primaryKey, false);

        if (!primaryKeyValue) {
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

        const user = await User[UserDataProvider](primaryKeyValue, modelPrimaryKey);

        // User Exists
        let message = "Email has an account already.";
        if (user) {
            http.with("reg_error", message);
            return this.backToRequest(http, {message}, false);
        }

        // Encrypt User Password
        password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

        // Setup new user data object
        const newUser = {[modelPrimaryKey]: primaryKeyValue, password, name};

        // Inset new user data object
        const RegisteredUser = await User[UserRegistrationHandler](newUser, http);

        if (!RegisteredUser) {
            return
        }

        // Emit Event
        $.events.emit(
            PluginConfig.get('events.userRegistered'),
            http,
            RegisteredUser
        );

        message = 'Registration successful, Login now!';

        http.with('reg_success', message);
        return this.backToRequest(http, {message}, true);
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
