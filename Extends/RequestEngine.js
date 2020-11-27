const {$, PluginConfig} = require('../config');
const User = $.use.model(PluginConfig.get('model'), true);

/**
 * Cache current config state
 * @type {import('../exports/config')}
 */
const cacheConfig = PluginConfig.all();
const modelPrimaryKey = PluginConfig.get('modelPrimaryKey', 'email');
const userDataProvider = cacheConfig.userDataProvider;


// Get Session Keys
// Needed for logout.
const DefaultSessionKeys = ['flash', 'publicKey', 'publicHash'];

const DefinedSessionKeys = PluginConfig.array("session.logout");
const LoginSessionKeys = PluginConfig.array("session.login");

const AllSessionKeys = DefaultSessionKeys.concat(DefinedSessionKeys);

/**
 * AuthRequestEngine
 * @param {Xpresser.Http} RequestEngine
 * @return {*}
 */
module.exports = function (RequestEngine) {
    return class extends RequestEngine {

        /**
         * Get Auth User Object
         * @returns {*}
         */
        authUser() {
            return this.res.locals[cacheConfig.templateVariable];
        }

        /**
         * Auth Initiator
         * @return {Promise<null|*>}
         */
        async auth() {
            if (!this.isLogged()) {
                return null;
            }

            const publicKey = $.base64.decodeToObject(this.session.publicKey);
            return User[userDataProvider](publicKey.key, publicKey.date);
        }

        /**
         * If User is logged
         * @returns {boolean}
         */
        isLogged() {
            /*
            * If authUser has been set before then return true.
            * Prevents Bcrypt from running twice.
            * ThereBy reducing runtime.
            */
            if (this.authUser() !== undefined) {
                return true;
            }

            const session = $.objectCollection(this.session);

            if (!session.exists([...DefaultSessionKeys, ...LoginSessionKeys])) {
                return false;
            }

            const keyAndValue = $.base64.decodeToObject(session.get('publicKey', {key: "", date: ""}));
            const unHashed = $.base64.decode(session.get('publicHash', 'none'));


            // @ts-ignore
            return unHashed === `${keyAndValue.key}:${keyAndValue.date}`
        }

        /**
         * Login a user using id
         * @param value - model primary key value.
         * @return {Promise<this>}
         */
        async loginUser(value) {
            const time = $.helpers.now();

            this.session.publicKey = $.base64.encode({key: value, date: time});
            this.session.publicHash = $.base64.encode(value + ':' + time);

            return this;
        }

        /**
         * Delete user sessions
         */
        logout() {
            const user = this.authUser();

            for (const sessionKey of AllSessionKeys) {
                delete this.session[sessionKey];
            }

            // Emit Event
            $.events.emit(cacheConfig.events.userLoggedOut, this, user);

            return this;
        }
    }
};
