module.exports = function (RequestEngine) {

    return class extends RequestEngine {
        customRenderer() {
            $.logErrorAndExit('Yes we got here!');
        }
    }

};