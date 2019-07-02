const PluginConfig = new ($.objectCollection)(require('../config'));
PluginConfig.merge(
    $.$config.get(
        'plugins[@xpresser/auth]',
        {}
    )
);

const User = $.use.model(PluginConfig.get('userModel'));
const Bcrypt = require("bcrypt");

class AuthController extends $.controller {

    static middleware() {
        return PluginConfig.get('authControllerMiddleware');
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

    dashboard(x) {
        const view = PluginConfig.get('views.index');

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
        const loginConfig = PluginConfig.clonePath('login');

        const email = x.body(loginConfig.get('email'), false);
        const password = x.body(loginConfig.get('password'), false);

        const errorMsg = "Incorrect Email/Password combination!";
        let logged = false;

        if (!email || !password) {
            return this.backToRequest(x, errorMsg, false)
        }

        const {db_email, db_password} = loginConfig.pick([
            'db_email',
            'db_password'
        ]);

        const user = await User.query()
            .where({
                [db_email]: email
            })
            .first();


        if (user === undefined) {

            x.with("login_error", errorMsg);

        } else {

            if (Bcrypt.compareSync(
                password,
                user[db_password]
            )) {
                logged = true;
                x.session.email = $.base64.encode(user[db_email]);
                x.session.loginKey = $.base64.encode(Bcrypt.hashSync(user[db_email], 10));
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

        return x.redirectToRoute(logged ? PluginConfig.get('routeAfterLogin') : 'auth');
    }

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
     * @param {XpresserAuth.RequestEngine} x
     * @return {Promise<void>}
     */
    async register(x) {
        const email = x.body("join-email", false);

        if (!email) {
            return this.backToRequest(x, `Email not found.`, false)
        }

        let password = x.body("join-password", false);

        if (!password) {
            return this.backToRequest(x, `Password not found.`, false)
        }

        let name = x.body("join-name", false);

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
