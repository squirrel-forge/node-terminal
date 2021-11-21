/**
 * Requires
 */
const DemoApplication = require( './DemoApplication' );
const DemoCommand = require( './DemoCommand' );

/**
 * Run demo application
 * @return {Promise<void>} - May throw errors
 */
async function demoApp() {

    // Initialize application
    const app = new DemoApplication();

    // Register commands
    app.register( DemoCommand );

    // Run application
    await app.run();
}

/**
 * Export
 * @type {demoApp}
 */
module.exports = demoApp;
