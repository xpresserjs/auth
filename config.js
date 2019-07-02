module.exports = {
    userModel: "Auth/User",
    routeAfterLogin: "auth.dashboard",
    templateVariable: "user",
    usingEjs: true,

    views: {
        index: "auth::index",
        dashboard: "auth::dashboard",
    },

    authControllerMiddleware: {
        'auth': 'dashboard',
        'auth.guest': ['index', 'login', 'register'],
    },

    login: {
        email: 'login-email',
        password: 'login-password',
        db_email: 'email',
        db_password: 'password'
    }
};
