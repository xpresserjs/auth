const PluginConfig = require('../config');
const modelPrimaryKey = PluginConfig.get('modelPrimaryKey', 'email');
const userDataProvider = PluginConfig.get('userDataProvider');


// Get Session Keys
// Needed for logout.
const DefaultSessionKeys = ['publicKey', 'publicHash'];

const DefinedSessionKeys = PluginConfig.array("session.logout");
const LoginSessionKeys = PluginConfig.array("session.login");

const AllSessionKeys = [
    ...DefaultSessionKeys,
    ...DefinedSessionKeys
];

/**
 * @type {Objection.Model | *}
 */
const User = $.use.model(PluginConfig.get('model'), true);


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
            return this.res.locals[PluginConfig.get('templateVariable')];
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
            return User[userDataProvider](publicKey);
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

            const keyAndValue = $.base64.decodeToObject(session.get('publicKey', {key: "", value: ""}));
            const unHashed = $.base64.decode(session.get('publicHash', 'none'));


            // @ts-ignore
            return unHashed === `${keyAndValue.key}:${keyAndValue.value}`
        }

        /**
         * Login a user using id
         * @param id
         * @return {Promise<void>}
         */
        async loginUser(id) {
            let modelPrimaryKeyValue = id;

            if (typeof id === "number") {
                let user;
                try{
                    user = await User[userDataProvider]();
                } catch (e) {
                    throw Error(e)
                }

                if (user) modelPrimaryKeyValue = user[modelPrimaryKey];
            }

            const time = $.helpers.now();

            this.session.publicKey = $.base64.encode({key: modelPrimaryKeyValue, value: time});
            this.session.publicHash = $.base64.encode(modelPrimaryKeyValue + ':' + time);
        }

        /**
         * Delete user sessions
         */
        logout() {
            for (const sessionKey of AllSessionKeys) {
                delete this.session[sessionKey];
            }
        }
    }
};
