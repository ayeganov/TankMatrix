'use strict';
requirejs.config({
    shim: {
        underscore: {
            exports: '_'
        }
    },
    baseUrl: 'lib',
    paths: {
        app: '../app'
    }
});

requirejs(['app/main']);
