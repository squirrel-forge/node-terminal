/* global require, module */
'use strict';

/**
 * Requires
 */
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const Command = require('../src/Command');

/**
 * Demo command
 */
class DemoCommand extends Command {

    /**
     * Constructor
     *
     * @param {Object} app - Application
     *
     * @return {void}
     */
    constructor( app ) {
        super( app, {
            name : 'demo',
            desc : 'Demo command with basic features.',
            args : [
                [ 'integer', 'delay', 'Time (ms) to delay command execution and show a spinner.' ],
            ],
        } );
    }

    /**
     * Fire command
     *
     * @return {Promise<void>}
     */
    fire() {
        return new Promise( async ( resolve ) => {
            const timeout = this.arg( 0 ) || 2000;
            this.progressStart( ' warming up...' );
            await this.wait( timeout );
            this.progressStop();
            cfx.info( ' Please enter your name:' );
            const data = await this.prompt();
            this.erase();
            this.erase();
            cfx.log( ' I suppose [fcyan]' + data.trim() + '[re] is the smart one?' );
            cfx.success( 'Go build your own command now!' );
            resolve();
        } );
    }

}


/**
 * Export
 * @type {DemoCommand}
 */
module.exports = DemoCommand;
