/* global require, module */
'use strict';

/**
 * Requires
 */
const DemoApplication = require( './DemoApplication' );
const DemoCommand = require( './DemoCommand' );

/**
 * Run demo application
 *
 * @return {void}
 */
function demo() {

    /**
     * Initialize application
     */
    const app = new DemoApplication();

    /**
     * Register commands
     */
    app.register( DemoCommand );

    /**
     * Run application
     */
    app.run();
}

/**
 * Export
 * @type {demo}
 */
module.exports = demo;
