/**
 * Requires
 */
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const prompt = require( '@squirrel-forge/node-util' ).prompt;
const wait = require( '@squirrel-forge/node-util' ).wait;
const Command = require( '../src/Command' );

/**
 * Demo command
 * @class
 */
class DemoCommand extends Command {

    /**
     * Constructor
     * @constructor
     * @param {Object} app - Application
     * @return {void}
     */
    constructor( app ) {
        super( app, {
            name : 'demo',
            description : 'Demo command with some basic features.',
            args : [
                [ 'integer', 'delay', 'Time (ms) to delay command execution and show a spinner.', 2000 ],
            ],
        } );
    }

    /**
     * Fire command
     * @return {Promise<void>} - May throw errors
     */
    async fire() {

        // Get timeout argument
        const timeout = parseInt( this.app.input.arg( 0 ) || 2000 );

        // Delay with a little progress
        this.app.progress.start( ' warming up...' );
        await wait( timeout );
        this.app.progress.stop();

        // Prompt the user
        cfx.info( ' Please enter your name:' );
        const data = await prompt();
        this.app.input.eraseLastLine();
        this.app.input.eraseLastLine();

        // Inform the user
        cfx.log( ' I suppose [fcyan]' + data.trim() + '[re] is the smart one now!' );
        cfx.success( 'Go build your own command!' );
    }
}

/**
 * Export
 * @type {DemoCommand}
 */
module.exports = DemoCommand;
