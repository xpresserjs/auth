const config = require('./Configs/config');

// Return plugin config as an object collection
const PluginConfig = $.objectCollection(config);

// Merge with user defined configuration
PluginConfig.merge(
    $.$config.get('plugins[@xpresser/auth]', {})
);

module.exports = PluginConfig;
