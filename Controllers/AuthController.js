const bcrypt = require("bcryptjs");
const {ServerResponse} = require('http');
const {$, PluginConfig, ControllerClass} = require('../config');
/**
 * Cache current config state
 * @type {import('../exports/config')}
 */
const cacheConfig = PluginConfig.all();
// Import User Model
const User = $.use.model(cacheConfig.model);

// Get providers
const UserPasswordProvider = cacheConfig.userPasswordProvider;
const UserDataProvider = cacheConfig.userDataProvider;
const UserRegistrationHandler = cacheConfig.userRegistrationHandler;
const UserLoginValidator = cacheConfig.userLoginValidator;


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

        data['form'] = data.action === 'register' ? cacheConfig.register : cacheConfig.login;

        const view = cacheConfig.views.index;
        return http.view(view, data, false, view === 'auth::index');
    }


    /**
     * Dashboard after Login
     * @param {Xpresser.Http} http
     * @return {void | Response }
     */
    dashboard(http) {
        const view = cacheConfig.views.index;
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

        const primaryKeyValue = http.body(cacheConfig.login.primaryKey, false);
        const password = http.body(cacheConfig.login.password, false);

        let errorMessage = cacheConfig.responseMessages.login_failed;
        let successMessage = cacheConfig.responseMessages.login_successful;

        let logged = false;

        if (!primaryKeyValue || !password) {
            http.with("login_error", errorMessage);
            return this.backToRequest(http, errorMessage, false)
        }

        let user_password = await User[UserPasswordProvider](primaryKeyValue, cacheConfig.modelPrimaryKey);

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
                        cacheConfig.events.userLoggedIn,
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
        if (http.req.xhr) {
            return http.toApi({
                logged,
                message: logged ? successMessage : errorMessage,
            }, logged);
        }

        return http.redirectToRoute(
            logged ?
                cacheConfig.routes.afterLogin :
                cacheConfig.routes.login
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

        if (cacheConfig.responseType === 'json' || http.req.xhr) {
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

        const modelPrimaryKey = cacheConfig.modelPrimaryKey;
        const primaryKeyValue = http.body(cacheConfig.register.primaryKey, false);

        if (!primaryKeyValue) {
            return this.backToRequest(http, cacheConfig.responseMessages.register_email_not_found, false)
        }

        let password = http.body(cacheConfig.register.password, false);

        if (!password) {
            return this.backToRequest(http, cacheConfig.responseMessages.register_email_not_found, false)
        }

        const user = await User[UserDataProvider](primaryKeyValue, modelPrimaryKey);

        // User Exists
        let message = cacheConfig.responseMessages.register_email_exists;
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

        // Emit Event
        $.events.emit(
            cacheConfig.events.userRegistered,
            http,
            RegisteredUser
        );

        message = cacheConfig.responseMessages.registration_successful;

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

        if (cacheConfig.responseType === 'json') {
            return http.toApi({
                logout: true,
                redirectTo: cacheConfig.routes.login
            })
        }

        // Return data
        http.with({logout: cacheConfig.responseMessages.logout_successful});

        return http.redirectToRoute(cacheConfig.routes.login);
    }
}

module.exports = AuthController;
