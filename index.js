module.exports = {
    boot: () => {
        $.log('BOOT ran!');
    },

    install: () => {
        $.log('INSTALL ran!');
    },

    uninstall: () => {
        $.log('UnInstall ran!');
    },

    migration: {

        after: () => {
            $.log('After Migration ran!');
        },

        before: () => {
            $.log('Before Migration ran!');
        },

    },

};