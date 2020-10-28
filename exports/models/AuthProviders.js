module.exports = {
    /**
     * Auth Password Provider
     * @param {any} value - Value of primary key field
     * @param {string} key - Name of primary key field
     */
    userPasswordProvider(value, key) {
        /* Return hashed user password from database */
    },


    /**
     * Auth Data Provider
     * @param {any} data - Value of primary key field
     */
    userDataProvider(data) {
        /* Return user data using primary key value */
    },


    /**
     * Auth Register handler
     * @param {object} formData - Registration Form
     * @param {Xpresser.Http} http - Current Request
     */
    userRegistrationHandler(formData, http) {
        /* Handle/Validate registration form data */
    },


    /**
     * Auth Register handler
     * @param {any} value - Value of primary key field
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