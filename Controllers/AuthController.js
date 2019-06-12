const User = $.use.model("Auth/User");
const Bcrypt = require("bcrypt");

class AuthController extends $.controller {

    static middleware() {
        return {
            'auth': 'dashboard',
            'auth.guest': ['index', 'login', 'register'],
        }
    }

    /**
     * Login/Auth Index
     * @param {RequestEngine} x
     * @return {*}
     */
    index(x) {
        const data = {
            action: x.get("action", "login")
        };

        const view = $.$config.get('auth.views.index', 'auth::index');

        let usingEjs = true;
        if (view !== 'auth::index') {
            usingEjs = $.$config.get('auth.usingEjs', true);
        }

        return x.view(view, data, false, usingEjs);
    }

    dashboard(x) {
        const view = $.$config.get('auth.views.index', 'auth::dashboard');

        let usingEjs = true;
        if (view !== 'auth::dashboard') {
            usingEjs = $.$config.get('auth.usingEjs', true);
        }

        return x.view(view, {}, false, usingEjs);
    }

    async login(x) {
        const email = x.get("login-email", false);
        const password = x.get("login-password", false);
        const errorMsg = "Incorrect email/password combination!";
        let logged = false;

        if (!email || !password) {
            return this.backToRequest(x, errorMsg, false)
        }

        const user = await User.query()
            .where({email})
            .first();


        if (user === undefined) {
            x.with("login_error", errorMsg);
        } else {
            if (Bcrypt.compareSync(password, user.password)) {
                logged = true;
                x.session.email = $.base64.encode(user.email);
                x.session.loginKey = $.base64.encode(Bcrypt.hashSync(user.email, 10));
                x.with("login", "Login successful. Welcome to your dashboard!");
            } else {
                x.with("login_error", errorMsg);
            }
        }

        // If is xhr request then return json.
        if (x.req.xhr) {
            return x.toApi({
                logged,
                msg: logged ? 'Login Successful.' : errorMsg,
            }, logged);
        }

        return x.redirectToRoute(logged ? $.config.auth.routeAfterLogin : 'auth');
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

    async register(x) {
        const email = x.get("join-email", false);

        if (!email) {
            return this.backToRequest(x, `Email not found.`, false)
        }

        let password = x.get("join-password", false);

        if (!password) {
            return this.backToRequest(x, `Password not found.`, false)
        }

        let name = x.get("join-name", false);

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

    logout(x) {

        delete x.session.email;
        delete x.session.loginKey;

        x.with({logout: "Logout successful."});

        return x.redirectToRoute("auth");
    }
}

module.exports = AuthController;
