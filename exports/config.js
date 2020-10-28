module.exports = {
    /**
     * The primary key in most auth applications is the 'email'
     * some other options maybe (username|loginKey|loginId|phone_number)
     */
    modelPrimaryKey: "email",

    /**
     * Define model where required auth functions are defined.
     * This will be imported from the users model directory using
     * @example
     * $.use.model('Auth/AuthProviders');
     */
    model: "Auth/AuthProviders",

    // Set Providers
    userPasswordProvider: "userPasswordProvider",
    userDataProvider: "userDataProvider",
    userRegistrationHandler: "userRegistrationHandler",
    userLoginValidator: "userLoginValidator",

    /**
     * Template variable name to be used in all views.
     * Saved in req.locals
     */
    templateVariable: "user",

    /**
     * Set to false if you are using custom views and custom template engine.
     */
    usingEjs: true,


    /**
     * Configure Auth routes
     */
    routes: {
        // if false, no routes from this plugin will be registered.
        enabled: true,
        // if prefix is defined it will be added to the url
        urlPrefix:  undefined,
        // if apiOnly is true, no route with views will be added.
        apiOnly: false,
        // Login Route Name
        login: "auth",
        // Route name to redirect to after login.
        afterLogin: "auth.dashboard",
    },

    /**
     * Configure Views if using custom views
     */
    views: {
        index: "auth::index",
        dashboard: "auth::dashboard",
    },

    /**
     * Set Login Form keys to be used in views
     * @example
     * e.g {password: 'login-password'}
     * =>
     * <input name="login-password" type="password">
     */
    login: {
        primaryKey: 'login-email',
        password: 'login-password',
    },

    /**
     * Set Registration Form keys to be used in views
     * @example
     * e.g {name: 'join-name'}
     * =>
     * <input name="join-name" type="text">
     */
    register: {
        primaryKey: 'join-email',
        password: 'join-password',
    },

    /**
     * Set Events to listen for at different stages of the auth process.
     */
    events: {
        // Emits when user logs in.
        userLoggedIn: 'Auth.userLoggedIn',
        // Emits when user logs out.
        userLoggedOut: 'Auth.userLoggedOut',
        // Emits when user just registered.
        userRegistered: 'Auth.userRegistered'
    },

    /**
     * Define session keys
     * @example
     * login: ['sessionKey1']
     * logout: ['sessionKey1']
     */
    session: {
        login: [],
        logout: [],
        registered: []
    }
};