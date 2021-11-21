/**
 * Requires
 */
const Application = require( '../src/Application' );

/**
 * Demo application class
 * @class
 */
class DemoApplication extends Application {

    /**
     * Constructor
     * @constructor
     */
    constructor() {
        super( { name : 'node-terminal demo application' } );
    }

}

/**
 * Export
 * @type {DemoApplication}
 */
module.exports = DemoApplication;
