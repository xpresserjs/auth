declare namespace Xpresser {
    interface Http {
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
         * Log User In
         * Using Email or id.
         * Sets loginKey session
         */
        loginUser(id: string | number): void;

        /**
         * Delete user session
         */
        logout(): void;
    }
}
