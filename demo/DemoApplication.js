/* global require, module */
'use strict';

/**
 * Requires
 */
const Application = require( '../src/Application' );

/**
 * Demo application
 */
class DemoApplication extends Application {

    /**
     * Constructor
     */
    constructor() {
        super( { name : 'Demo application' } );
    }

}

/**
 * Export
 * @type {DemoApplication}
 */
module.exports = DemoApplication;
