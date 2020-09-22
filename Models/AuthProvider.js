module.exports = {
    /**
     * Auth Password Provider
     * @param {any} value - Value of primary key field
     * @param {string} key - Name of primary key field
     */
    authPasswordProvider(value, key) {
        /* Return user password */
    },


    /**
     * Auth Password Provider
     * @param {any} value - Value of primary key field
     */
    authDataProvider(value) {
        /* Return user data */
    },


    /**
     * Auth Register handler
     * @param {object} formData - Registration Form
     * @param {Xpresser.Http} http - Current Request
     */
    authRegisterHandler(formData, http) {
        /* Handle/Validate registration form data */
    },


    /**
     * Auth Register handler
     * @param {any} value - Value of primary key field
     * @param {Xpresser.Http} http - Current Request
     */
    authLoginValidator(value, http) {
        /* Run Validator Here. */

        return {
            // Return error message (string) if error occurred in validation.
            error: false,

            // Return false if you don't want the plugin to respond to this request.
            proceed: true
        }
    }
}