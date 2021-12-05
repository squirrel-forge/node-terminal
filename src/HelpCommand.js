/**
 * Requires
 */
const { cfx } = require( '@squirrel-forge/node-cfx' );
const { callback } = require( '@squirrel-forge/node-util' );
const Command = require( './Command' );

/**
 * Help command
 * @class
 */
class HelpCommand extends Command {

    /**
     * Constructor
     * @constructor
     * @param {Object} app - Application
     */
    constructor( app ) {
        super( app, {
            name : 'help',
            description : 'Shows a list of all registered commands and some general information.',
        } );
    }

    /**
     * Fire command
     * @public
     * @return {Promise<void>} - May throw errors
     */
    async fire() {
        cfx.success( this.app.options.name + ': Help' );
        cfx.log( this.app.options.description );

        // Inject after description
        callback( 'help_head', this );

        // Global flags
        this._printFlags( this.app.options.flags, 'Global flags:' );

        // Inject after description
        callback( 'help_flags', this );

        // Sorted commands
        cfx.warn( 'Commands:' );
        const keys = Object.keys( this.app._commands );
        keys.sort();
        let i, cmd;
        for ( i = 0; i < keys.length; i++ ) {
            cmd = new this.app._commands[ keys[ i ] ]( this.app );
            cfx.log( ' [fgreen]' + cmd.options.name + '[re]' +
                    ( this._flag_verbose ? ' [[fcyan]class[re]][fcyan]' + cmd.constructor.name + '[re]' : '' ) +
                    ' : ' + cmd.options.description );
        }

        // Inject after description
        callback( 'help_commands', this );
    }

}

/**
 * Export
 * @type {HelpCommand}
 */
module.exports = HelpCommand;
