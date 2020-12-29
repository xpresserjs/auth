import "xpresser/types/http";
export type XpresserAuthUser = any;

declare module "xpresser/types/http" {
    interface Http {
        /**
         * Get Auth User Object
         * @returns {*}
         */
        authUser<T=XpresserAuthUser>(): T;

        /**
         * Auth Initiator
         * @return {Promise<null|*>}
         */
        auth<T=XpresserAuthUser>(): Promise<T>

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
