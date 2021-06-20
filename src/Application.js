/* global require, module, process */
'use strict';

/**
 * Requires
 */
const ucfirst = require('ucfirst');
const objm = require( '@squirrel-forge/node-objection' );
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const Terminal = require( './Terminal' );
const Command = require( './Command' );
const HelpCommand = require( './HelpCommand' );

/**
 * Application class
 *
 * @abstract
 */
class Application extends Terminal {

    /**
     * Constructor
     *
     * @param {null|Object} options - Options object
     * @param {boolean} init - Initialize application, default: true
     */
    constructor( options, init ) {
        init = init !== false;

        // Call super constructor
        super();
        this.timer.start( 'application-construct' );

        // Default options
        this._defaults = {
            name : 'Application',
            cwd : process.cwd(),
            default : 'help',
            flags : [
                [ '-v', '--verbose', 'Enable debug output.' ],
                [ '-d', '--describe', 'Describe command arguments and flags.' ],
            ],
        };

        // Setup options
        this._options = objm.cloneObject( this._defaults, true );

        // Apply custom options
        if ( objm.isPojo( options ) ) {
            objm.mergeObject( this._options, options, true, true, true, true );
        }

        // Registered commands
        this._commands = {};

        // Call information
        this._command = null;
        this._args = [];
        this._flags = [];

        // Initialize
        if ( init ) {
            this._init();
        }
    }

    /**
     * Initialize application
     *
     * @private
     *
     * @param {boolean} register - Register defaults commands
     *
     * @return {void}
     */
    _init( register ) {
        register = register !== false;

        // Get arguments
        this._parseInput();

        // Set application flags
        this.setFlagProps( this, this._options.flags, this._flags );

        // Register default commands
        if ( register ) {
            this.register( HelpCommand );
        }
    }

    /**
     * Parse arguments
     *
     * @param {null|Array} args - Arguments
     *
     * @private
     *
     * @return {void}
     */
    _parseInput( args ) {

        // Default remove the command call itself from the args
        args = args || process.argv.slice( 2 );

        // No args available
        if ( !args.length ) {

            // Execute default command
            if ( this._options.default ) {
                args = [ this._options.default ];
            } else {
                throw new Error( cfx.setStyle( '[bred][fwhite]  No arguments supplied or default command not set.  [re]' ) );
            }
        }

        // Set default command if first argument is a flag
        if ( args[ 0 ] && args[ 0 ].substr( 0, 1 ) === '-' ) {
            this._command = this._options.default;
        } else {
            this._command = args.shift().toLowerCase();
        }

        // Set args and flags
        for ( var i = 0; i < args.length; i++ ) {
            if ( args[ i ][ 0 ] === '-' ) {
                this._flags.push( args[ i ] );
            } else {
                this._args.push( args[ i ] );
            }
        }
    }

    /**
     * Register command class
     *
     * @param {Command} CMD_Class - Command class
     *
     * @return {void}
     */
    register( CMD_Class ) {
        if ( typeof CMD_Class !== 'function' ) {
            throw Error( cfx.setStyle( '[bred][fwhite]  Command must be a constructor and inherit from the Command class.  [re]' ) );
        }
        this._commands[ CMD_Class.name ] = CMD_Class;
    }

    /**
     * Print unknown command message
     *
     * @private
     *
     * @param {string} cmd_name - Command input name
     *
     * @return {void}
     */
    _printUnknownCommand( cmd_name ) {
        cmd_name = cmd_name || this._command;
        cfx.error( 'Unknown command: ' + cmd_name );
    }

    /**
     * Command exists
     *
     * @param {string} cmd_name - Command input name
     * @param {boolean} show_error - Show not found error, default: true
     *
     * @return {null|string} - Command class name or null if not defined
     */
    commandExists( cmd_name, show_error ) {
        cmd_name = cmd_name || this._command;
        show_error = show_error !== false;

        // Build command classname
        const CMD_Class = ucfirst( cmd_name ) + 'Command';

        // Command not found
        if ( !this._commands[ CMD_Class ] ) {

            // Show error
            if ( show_error ) {
                if ( this._flag_verbose ) {
                    throw Error( cfx.setStyle( '[bred][fwhite]  Command "' + cmd_name + '" class[' + CMD_Class + '] not defined.  [re]' ) );
                } else {
                    this._printUnknownCommand( cmd_name );
                }
            }
            return null;
        }

        // Command found
        return CMD_Class
    }

    getArgDesc( index, args ) {
        if ( args[ index ] && args[ index ][ 2 ] ) {
            return args[ index ][ 2 ];
        }
        return null;
    }

    getFlagDesc( flag, flags ) {
        for ( let i = 0; i < flags.length; i++ ) {
            if ( flags[ i ][ 0 ] === flag || flags[ i ][ 1 ] === flag ) {
                return flags[ i ][ 2 ];
            }
        }
        return null;
    }

    /**
     * Run application
     *
     * @param {boolean} xit - Exit after completion
     *
     * @return {Promise<void>}
     */
    async run( xit = true ) {

        // Break on not found
        const CMD_Class = this.commandExists();
        if ( !CMD_Class ) {
            this.exit();
        }

        // Create command instance
        const cmd = new this._commands[ CMD_Class ]( this );

        // Notify start and measure time
        if ( cmd._flag_verbose ) {

            this.timer.start( 'application-run-verbose' );
            cfx.success( 'Command ' + this._command + ' running in: ' + this._options.cwd );

            // Arguments
            if ( this._args.length ) {
                cfx.log( '\n With arguments:' );
                for ( let i = 0; i < this._args.length; i++ ) {
                    cfx.log( '  [fgreen]' + this._args[ i ] + '[re] ' + this.getArgDesc( i, cmd._options.args ) );
                }
            }

            // Flags
            if ( this._flags.length ) {
                cfx.log( '\n With flags:' );
                for ( let i = 0; i < this._flags.length; i++ ) {
                    cfx.log( '  [fgreen]' + this._flags[ i ] + '[re] ' + this.getFlagDesc( this._flags[ i ], cmd._options.flags ) );
                }
            }
            cfx.log( '' );
        }

        // Precheck command execution
        if ( await cmd.before() === true ) {

            // Fire the command
            await cmd.fire();

            // Show completion
            if ( cmd._flag_verbose ) {
                cfx.log( '' );
                cfx.success( 'Command ' + this._command + ' completed in ' + this.timer.end( 'application-run-verbose' ) );
                cfx.log( '' );
            }
        } else {

            // Show completion
            if ( cmd._flag_verbose ) {
                cfx.log( '' );
                cfx.success( 'Precheck ' + this._command + ' completed in ' + this.timer.end( 'application-run-verbose' ) );
                cfx.log( '' );
            }
        }

        // End application process
        if ( xit ) {
            this.exit( cmd._flag_verbose );
        }
    }
}

module.exports = Application;
