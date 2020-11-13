const {getInstance} = require('xpresser');
const config = require('./exports/config');
const $ = getInstance();

// Return plugin config as an object collection
const PluginConfig = $.objectCollection(config);

// Merge with user defined configuration
PluginConfig.merge(
    $.config.get('plugins[@xpresser/auth]', {})
);

module.exports = {$, PluginConfig};
