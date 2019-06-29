import RE = require("xpresser/src/RequestEngine");

declare namespace XpresserAuth {
    class RequestEngine extends RE {
        /**
         * Get Auth User Object
         * @returns {*}
         */
        authUser(): any;

        /**
         * Auth Initiator
         * @return {Promise<null|*>}
         */
        auth(): any

        /**
         * If User is logged
         * @returns {boolean}
         */
        isLogged(): boolean;

        /**
         * Delete user session
         */
        logout(): void;
    }
}
