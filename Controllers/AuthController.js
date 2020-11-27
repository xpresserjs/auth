const bcrypt = require("bcryptjs");
const {ServerResponse} = require('http');
const {$, PluginConfig, ControllerClass} = require('../config');
/**
 * Cache current config state
 * @type {import('../exports/config')}
 */
const configCache = PluginConfig.all();
// Import User Model
const User = $.use.model(configCache.model);

// Get providers
const UserPasswordProvider = configCache.userPasswordProvider;
const UserDataProvider = configCache.userDataProvider;
const UserRegistrationHandler = configCache.userRegistrationHandler;
const UserLoginValidator = configCache.userLoginValidator;


class AuthController extends ControllerClass {

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

        data['form'] = data.action === 'register' ? configCache.register : configCache.login;

        const view = configCache.views.index;
        return http.view(view, data, false, view === 'auth::index');
    }


    /**
     * Dashboard after Login
     * @param {Xpresser.Http} http
     * @return {void | Response }
     */
    dashboard(http) {
        const view = configCache.views.dashboard;
        return http.view(view, {}, false, view === 'auth::dashboard');
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

        const primaryKeyValue = http.body(configCache.login.primaryKey, false);
        const password = http.body(configCache.login.password, false);

        let errorMessage = configCache.responseMessages.login_failed;
        let successMessage = configCache.responseMessages.login_successful;

        let logged = false;

        if (!primaryKeyValue || !password) {
            http.with("login_error", errorMessage);
            return this.backToRequest(http, errorMessage, false)
        }

        let user_password = await User[UserPasswordProvider](primaryKeyValue, configCache.modelPrimaryKey);

        if (!user_password) {
            http.with("login_error", errorMessage);
        } else {
            if (bcrypt.compareSync(
                password,
                user_password
            )) {
                logged = true;
                let validatorResult = null;

                if (typeof User[UserLoginValidator] === "function") {

                    /**
                     * User Defined Validation result.
                     * @type {{proceed: boolean, error: boolean | string}}
                     */
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
                        configCache.events.userLoggedIn,
                        http,
                        primaryKeyValue
                    );

                    http.with("login", successMessage);
                } else {
                    http.with("login_error", errorMessage);
                }

            } else {
                http.with("login_error", errorMessage);
            }

        }

        // If is xhr request then return json.
        // noinspection JSUnresolvedVariable
        if (configCache.responseType === 'json' || http.req.xhr) {
            return http.toApi({
                logged,
                message: logged ? successMessage : errorMessage,
            }, logged);
        }

        return http.redirectToRoute(
            logged ?
                configCache.routes.afterLogin :
                configCache.routes.login
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

        if (configCache.responseType === 'json' || http.req.xhr) {
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

        const modelPrimaryKey = configCache.modelPrimaryKey;
        const primaryKeyValue = http.body(configCache.register.primaryKey, false);

        if (!primaryKeyValue) {
            return this.backToRequest(http, configCache.responseMessages.register_email_not_found, false)
        }

        let password = http.body(configCache.register.password, false);

        if (!password) {
            return this.backToRequest(http, configCache.responseMessages.register_email_not_found, false)
        }

        const user = await User[UserDataProvider](primaryKeyValue, modelPrimaryKey);

        // User Exists
        let message = configCache.responseMessages.register_email_exists;
        if (user) {
            http.with("reg_error", message);
            return this.backToRequest(http, {message}, false);
        }

        // Encrypt User Password
        password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

        // Setup new user data object
        const newUser = {[modelPrimaryKey]: primaryKeyValue, password};

        // Inset new user data object
        const RegisteredUser = await User[UserRegistrationHandler](newUser, http);

        if (RegisteredUser instanceof ServerResponse) {
            return
        }

        if (RegisteredUser instanceof Error) {
            http.with('reg_error', RegisteredUser.message);
            return this.backToRequest(http, {message: RegisteredUser.message}, false);
        }

        // Emit Event
        $.events.emit(
            configCache.events.userRegistered,
            http,
            RegisteredUser
        );

        message = configCache.responseMessages.registration_successful;

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
            // log user out.
            http.logout();
        }

        if (configCache.responseType === 'json') {
            return http.toApi({
                logout: true,
                redirectTo: configCache.routes.login
            })
        }

        // Return data
        http.with({logout: configCache.responseMessages.logout_successful});

        return http.redirectToRoute(configCache.routes.login);
    }
}

module.exports = AuthController;
