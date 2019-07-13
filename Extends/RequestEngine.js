const PluginConfig = require('../config');
const Bcrypt = require("bcrypt");
/**
 * @type {Objection.Model | *}
 */
const User = $.use.model(PluginConfig.get('model'), true);

/**
 * AuthRequestEngine
 * @param {XpresserHttp.Engine} RequestEngine
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
            const x = this;

            if (!x.isLogged()) {
                return null;
            }

            const email = $.base64.decode(x.session.email);

            return await User.query().where("email", email).first();
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

            const x = this;

            if (typeof x.session.email === "undefined" || typeof x.session.loginKey === "undefined") {
                return false;
            }

            const email = $.base64.decode(x.session.email);
            const hash = $.base64.decode(x.session.loginKey);

            // @ts-ignore
            return !!Bcrypt.compareSync(email, hash);
        }

        async loginUser(id) {
            let email = id;

            if (typeof id === "number") {
                const user = await User.query().where({id}).first();

                if (user) {
                    email = user.email;
                }
            }

            this.session.email = $.base64.encode(email);
            this.session.loginKey = $.base64.encode(Bcrypt.hashSync(email, 10));
        }

        /**
         * Delete user session
         */
        logout() {
            delete this.session.email;
            delete this.session.loginKey;
        }
    }
};
