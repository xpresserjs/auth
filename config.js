/**
 * @type {ObjectCollection}
 */
const PluginConfig = $.objectCollection({
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
    },

    events: {
        userLoggedIn: 'Auth.userLoggedIn',
        userLoggedOut: 'Auth.userLoggedOut',
        userRegistered: 'Auth.userRegistered'
    },
});

// Merge with user defined configuration
PluginConfig.merge(
    $.$config.get('plugins[@xpresser/auth]', {})
);

module.exports = PluginConfig;
