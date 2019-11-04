const PluginConfig = require('../config');
const bcrypt = require("bcryptjs");
const modelWhere = PluginConfig.get('modelWhere', 'email');

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

            const publicKey = $.base64.decodeToJson(this.session.publicKey);
            return User.query().where(modelWhere, publicKey.key).first();
        }

        /**
         * If User is logged
         * @returns {boolean}
         */
        isLogged() {
            /*
            * If authUser has been set before then return true.
            * Prevents Bcrypt from running twice.
            * ThereBy increasing runtime.
            */
            if (this.authUser() !== undefined) {
                return true;
            }

            const session = $.objectCollection(this.session);

            if (!session.exists([...DefaultSessionKeys, ...LoginSessionKeys])) {
                return false;
            }

            const keyAndValue = $.base64.decodeToJson(session.get('publicKey', {key: "", value: ""}));
            const unHashed = $.base64.decode(session.get('publicHash', 'none'));


            // @ts-ignore
            return unHashed === `${keyAndValue.key}:${keyAndValue.value}`
        }

        async loginUser(id) {
            let modelWhereValue = id;

            if (typeof id === "number") {
                const user = await User.query().where({id}).first();

                if (user) {
                    modelWhereValue = user[modelWhere];
                }
            }

            const time = $.helpers.now();

            this.session.publicKey = $.base64.encode({key: modelWhereValue, value: time});
            this.session.publicHash = $.base64.encode(modelWhereValue + ':' + time);
        }

        /**
         * Delete user session
         */
        logout() {
            for (const sessionKey of AllSessionKeys) {
                delete this.session[sessionKey];
            }
        }
    }
};
