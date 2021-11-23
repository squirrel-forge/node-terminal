/**
 * Requires
 */
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const objm = require( '@squirrel-forge/node-objection' );
const Exception = require( '@squirrel-forge/node-util' ).Exception;
const callback = require( '@squirrel-forge/node-util' ).callback;

/**
 * @typedef {Object} CommandOptions
 */

/**
 * Command exception
 * @class
 */
class CommandException extends Exception {}

/**
 * Command class
 * @class
 * @abstract
 */
class Command {

    /**
     * Constructor
     * @constructor
     * @param {Object} app - Application
     * @param {Object} options - Options object, default: null
     */
    constructor( app, options = null ) {

        // Command stats
        app.timer.start( 'command-construct' );

        /**
         * Application reference
         * @type {Application}
         */
        this.app = app;

        /**
         * Default options
         * @public
         * @type {CommandOptions}
         */
        this._defaults = {
            name : '[no name]',
            description : '[no description]',

            // Arguments must be ordered and handled by index position
            // [ 'type', 'name', 'description', default ]
            args : [],

            // Flags are boolean values, default is always false
            // _flag_name : [ '-short', '--long', default, boolean, 'description' ]
            flags : {},
        };

        /**
         * Options
         * @public
         * @type {CommandOptions}
         */
        this.options = objm.cloneObject( this._defaults, true );

        // Apply custom options
        if ( objm.isPojo( options ) ) {
            objm.mergeObject( this.options, options, true, true, true, true );
        }

        // Set known flags as properties
        app.setInputProps( this, app.options.flags );
        app.setInputProps( this, this.options.flags );
    }

    /**
     * Get argument data
     * @public
     * @param {number} index - Argument index
     * @return {null|{def: *, name: *, type: *, desc: *}} - Argument info
     */
    argData( index ) {
        if ( this.options.args[ index ] ) {
            const [ type, name, desc, def ] = this.options.args[ index ];
            return { name, type, desc, def };
        }
        return null;
    }

    /**
     * Find flag in list
     * @protected
     * @param {string} flag - Flag input
     * @param {Array} flags - Object entries of flags options
     * @return {null|{def: *, bool: *, name: *, short: *, long: *, desc: *}} - Flag info
     */
    _findFlag( flag, flags ) {
        for ( let i = 0; i < flags.length; i++ ) {
            const [ name, data ] = flags[ i ];
            const [ short, long, def, bool, desc ] = data;
            if ( short === flag || long === flag ) {
                return { name, short, long, def, bool, desc };
            }
        }
        return null;
    }

    /**
     * Get flag data
     * @param {string} flag - Flag input
     * @return {null|{def: *, bool: *, name: *, short: *, long: *, desc: *}} - Flag info
     */
    flagData( flag ) {
        let data = this._findFlag( flag, Object.entries( this.app.options.flags ) );
        if ( !data ) {
            data = this._findFlag( flag, Object.entries( this.options.flags ) );
        }
        return data;
    }

    /**
     * Convert value to string
     * @param {*} def - Value
     * @return {null|string} - String if converted
     */
    getDefaultString( def ) {
        let display_default = null;
        switch ( typeof def ) {
        case 'boolean' :
            display_default = def ? 'true' : 'false';
            break;
        case 'string' :
            display_default = '"' + def + '"';
            break;
        case 'object' :
            if ( def === null ) {
                display_default = 'null';
            }
        }
        return display_default;
    }

    /**
     * Print arguments
     * @protected
     * @param {Array} args - Arguments array
     * @param {null|string} title - Block title, default 'Arguments:'
     * @return {void}
     */
    _printArgs( args, title = 'Arguments:' ) {

        // Show arguments list if there are any
        if ( args.length ) {
            if ( title ) {
                cfx.warn( title );
            }
            for ( let i = 0; i < args.length; i++ ) {
                const [ type, name, description, def ] = args[ i ];
                const display_default = this.getDefaultString( def );
                cfx.log( ' [fgreen]' + i + '[re]' +
                    ' [fcyan]' + name + '[re]' +
                    ' {[fyellow]' + type + '[re]}' +
                    ' : ' + description + ( display_default ?
                    ', [fyellow]default[re]: ' + display_default : '' ) );
            }
        }
    }

    /**
     * Print flags and options
     * @protected
     * @param {Object} flags - Flags and options object
     * @param {string} title - Block title, default: 'Flags:'
     * @return {void}
     */
    _printFlags( flags, title = 'Flags and options:' ) {

        // Show flags list
        const entries = Object.entries( flags );
        if ( entries.length ) {
            if ( title ) {
                cfx.warn( title );
            }
            for ( let i = 0; i < entries.length; i++ ) {
                const [ short, long, def, bool, description ] = entries[ i ][ 1 ];
                const display_default = this.getDefaultString( def );
                cfx.log( ' [fgreen]' + short + '[re], [fgreen]' + long + '[re]' +
                    ' : ' + description + ( !bool && display_default ?
                    ', [fyellow]default[re]: ' + display_default : '' ) );
            }
        }
    }

    /**
     * Describe the command
     * @public
     * @return {void}
     */
    describe() {

        // Name and description
        cfx.success( this.app.options.name + ' describing command: ' + this.options.name
            + ( this._flag_verbose ? '[' + this.constructor.name + ']' : '' ) );
        cfx.log( this.options.description );

        // Inject after description
        callback( 'describe_extend', this );

        // Show args and flags
        this._printArgs( this.options.args );
        this._printFlags( this.options.flags );
        this._printFlags( this.app.options.flags, 'Global flags and options:' );

        // Inject after args and flags
        callback( 'describe_end', this );
    }

    /**
     * Validate command execution
     * @public
     * @return {Promise<boolean>} - True if command should be executed
     */
    before() {
        return new Promise( ( resolve ) => {
            if ( this._flag_describe ) {
                this.describe();
                resolve( false );
            }
            resolve( true );
        } );
    }

    /**
     * Fire command
     * @abstract
     * @throws CommandException
     * @return {void}
     */
    fire() {
        throw new CommandException( 'Command class must implement a fire method: ' + this.constructor.name );
    }

}

// Export Exception as static property constructor
Command.CommandException = CommandException;

/**
 * Export
 * @type {Command}
 */
module.exports = Command;
