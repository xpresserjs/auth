module.exports = {
    usingEjs: true,
    model: "Auth/User",
    templateVariable: "user",

    routes: {
        login: "auth",
        afterLogin: "auth.dashboard",
    },

    views: {
        index: "auth::index",
        dashboard: "auth::dashboard",
    },

    login: {
        email: 'login-email',
        password: 'login-password',
    },

    register: {
        email: 'join-email',
        password: 'join-password',
        name: 'join-name'
    }
};
