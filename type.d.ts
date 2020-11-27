declare namespace Xpresser {
    interface Http {
        /**
         * Get Auth User Object
         * @returns {*}
         */
        authUser<T=any>(): T;

        /**
         * Auth Initiator
         * @return {Promise<null|*>}
         */
        auth<T>(): Promise<T>

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
