module.exports = {
    /**
     * Auth Password Provider
     * @param {any} value - Value of users primary key field
     * @param {string} key - Name of users primary key field
     */
    async userPasswordProvider(value, key) {
        /* Return hashed user password from database */
    },


    /**
     * Auth Data Provider
     * @param {any} key - Value of users primary key field
     * @param {string} loginTime - login time.
     */
    async userDataProvider(key, loginTime) {
        /* Return user data using primary key value */
    },


    /**
     * Auth Register handler
     *
     * **Note:** Must return true or any value but not undefined, false or null
     * Any data returned that passes the above validation is passed to the `events.userRegistered` event,
     * given you opportunity to do more with the current `http` instance.
     *
     * @param {object} formData - Registration Form
     * @param {Xpresser.Http} http - Current Request
     */
    async userRegistrationHandler(formData, http) {

        // Remove this code and handle your user registration.
        return http.newError().view({
            message: 'No registration handler yet!',
            log: new Error().stack
        })
    },


    /**
     * Auth Register handler
     * @param {any} value - Value of users primary key field
     * @param {Xpresser.Http} http - Current Request
     */
    userLoginValidator(value, http) {
        /* Run Validator Here. */

        return {
            // Return error message (string) if error occurred during validation.
            error: false,

            // Return false if you don't want the plugin to respond to this request.
            proceed: true
        }
    }
}