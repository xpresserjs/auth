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
        const email = x.get("login-email", "");
        const password = x.get("login-password", "");
        const errorMsg = "Incorrect email/password combination!";
        let logged = false;

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

    async register(x) {
        const email = x.get("join-email");
        const user = await User.query()
            .where({email})
            .first();

        // User Exists
        if (user !== undefined) {
            x.with("reg_error", "Email has an account already.");
            return x.withOld().redirectBack();
        }

        // Encrypt User Password
        const password = Bcrypt.hashSync(x.get("join-password"), 10);

        // Get User Name
        const name = x.get("join-name");

        // Setup new user data object
        const newUser = {email, password, name};

        // Inset new user data object
        await User.query().insert(newUser);

        x.with('reg_success', 'Registration successful, Login now!');
        return x.redirectToRoute('auth');
    }

    logout(x) {

        delete x.session.email;
        delete x.session.loginKey;

        x.with({logout: "Logout successful."});

        return x.redirectToRoute("auth");
    }
}

module.exports = AuthController;