/**
 * Requires
 */
const ucfirst = require( 'ucfirst' );
const objm = require( '@squirrel-forge/node-objection' );
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const Exception = require( '@squirrel-forge/node-util' ).Exception;
const CliInput = require( '@squirrel-forge/node-util' ).CliInput;
const Timer = require( '@squirrel-forge/node-util' ).Timer;
const Progress = require( '@squirrel-forge/node-util' ).Progress;
const HelpCommand = require( './HelpCommand' );
const path = require( 'path' );

/**
 * @typedef {Object} ApplicationOptions
 */

/**
 * Application exception
 * @class
 */
class ApplicationException extends Exception {}

/**
 * Application class
 * @class
 * @abstract
 */
class Application {

    /**
     * Constructor
     * @constructor
     * @param {null|Object} options - Options object, default: null
     * @param {boolean} init - Initialize application, default: true
     */
    constructor( options = null, init = true ) {

        /**
         * Timer
         * @public
         * @type {Timer}
         */
        this.timer = new Timer();

        /**
         * Default options
         * @public
         * @type {ApplicationOptions}
         */
        this._defaults = {
            name : 'Application',
            description : '',
            self : path.resolve( __dirname, '../../' ),

            // cwd : process.cwd(),
            default : 'help',
            flags : {
                _flag_version : [ '-v', '--version', false, true, 'Show application version' ],
                _flag_verbose : [ '-i', '--verbose', false, true, 'Enable verbose output' ],
                _flag_describe : [ '-d', '--describe', false, true, 'Describe command arguments, flags and options' ],
                _flag_help : [ '-h', '--help', false, true, 'Optionally calls the help command' ],
            },
        };

        /**
         * Options
         * @public
         * @type {ApplicationOptions}
         */
        this.options = objm.cloneObject( this._defaults, true );

        // Apply custom options
        if ( options && objm.isPojo( options ) ) {
            objm.mergeObject( this.options, options, true, true, true, true );
        }

        /**
         * Registered commands
         * @protected
         * @type {Object}
         */
        this._commands = {};

        /**
         * Input
         * @public
         * @type {null|CliInput}
         */
        this.input = null;

        /**
         * Progress display
         * @public
         * @type {Progress}
         */
        this.progress = new Progress();

        // Initialize
        if ( init ) {
            this._init();
        }
    }

    /**
     * Initialize application
     * @protected
     * @param {boolean} register - Register defaults commands
     * @param {null|Array<string>} args - Arguments, options and flags
     * @return {void}
     */
    _init( register = true, args = null ) {
        process.stdin.setEncoding( 'utf-8' );

        // Init input
        this.input = new CliInput( cfx, args );

        // Set application flags and options
        this.setInputProps( this, this.options.flags );

        // Register default commands
        if ( register ) {
            this.register( HelpCommand );
        }
    }

    /**
     * Set all setFlags as properties
     * @public
     * @param {Object} target - Target object
     * @param {{name:['short','long','default',boolean]}} flags - Flags and options source map
     * @return {void}
     */
    setInputProps( target, flags ) {
        const options = this.input.getFlagsOptions( flags );
        Object.assign( target, options );
    }

    /**
     * Register command class
     * @public
     * @param {Command} CMD_Class - Command class constructor
     * @return {void}
     */
    register( CMD_Class ) {
        if ( typeof CMD_Class !== 'function' ) {
            throw new ApplicationException( 'Must be a command constructor not type: ' + typeof CMD_Class );
        }
        if ( this._commands[ CMD_Class.name ] ) {
            throw new ApplicationException( 'Command already exists: ' + CMD_Class.name );
        }
        this._commands[ CMD_Class.name ] = CMD_Class;
    }

    /**
     * Get valid command name
     * @public
     * @param {string} cmd_name - Command input name
     * @return {null|Function} - Command class or null if not defined
     */
    getCommandName( cmd_name ) {

        // We have nothing
        if ( typeof cmd_name !== 'string' || !cmd_name.length ) {
            return null;
        }

        // Build command classname
        const CMD_Class = ucfirst( cmd_name ) + 'Command';

        // Command not found
        if ( !this._commands[ CMD_Class ] ) {
            return null;
        }

        // Command found
        return CMD_Class;
    }

    /**
     * Get command instance
     * @param {string} CMD_Class - Classname
     * @param {null|Object} options Command options
     * @return {Command} - Command instance
     */
    getCommandInstance( CMD_Class, options = null ) {
        return new this._commands[ CMD_Class ]( this, options );
    }

    /**
     * Run application
     * @public
     * @param {Object} options - Command options
     * @param {boolean} xit - Exit after completion
     * @return {Promise<void>} - Possibly throws errors
     */
    async run( options = null, xit = true ) {

        // Show version
        if ( this._flag_version ) {
            let pkg;
            try {
                pkg = require( path.join( this.options.self, 'package.json' ) );
            } catch ( e ) {
                cfx.error( e );
                this.exit( 1 );
            }
            cfx.log( pkg.name + '@' + pkg.version );
            if ( this._flag_verbose ) {
                cfx.info( '- Installed at: ' + this.options.self );
            }
            this.exit( 0 );
        }

        // Get input command name and class
        let command = this.input.arg(), CMD_Class = this.getCommandName( command );

        // Force help command
        if ( this._flag_help ) {
            command = 'help';
            CMD_Class = this.getCommandName( command );
        }

        // Warn and fallback if not found
        if ( !CMD_Class ) {
            cfx.error( this.options.name + ' unknown command: ' + command );

            // Check for similar commands
            // TODO: check match percent to defined commands and prompt user

            // Check for a default command to run instead
            if ( this.options.default ) {
                CMD_Class = this.getCommandName( this.options.default );
                if ( CMD_Class ) {
                    command = this.options.default;
                }
            }

            // No fallback command found
            if ( !CMD_Class ) {
                cfx.error( this.options.name + ' no valid command defined: ' + ( this.options.default || 'null' ) );
                this.exit( 1 );
            }
        }

        // Remove command from input arguments
        this.input._i.args.shift();

        // Create command instance
        const cmd = this.getCommandInstance( CMD_Class, options );

        // Notify start and measure time
        if ( cmd._flag_verbose ) {
            this.timer.start( 'application-run-verbose' );

            cfx.success( 'Running command ' + command + ' in ' + process.cwd() );

            // Arguments
            if ( this.input._i.args.length ) {
                cfx.log( 'With arguments:' );
                for ( let i = 0; i < this.input._i.args.length; i++ ) {
                    const data = cmd.argData( i );
                    cfx.log( '  [fgreen]' + this.input._i.args[ i ] + '[re] '
                        + ( data ? data.desc : 'Unknown argument' ) );
                }
            }

            // Flags
            if ( this.input._i.flags.length ) {
                cfx.log( 'With flags:' );
                for ( let i = 0; i < this.input._i.flags.length; i++ ) {
                    const flag = this.input._i.flags[ i ];
                    const data = cmd.flagData( flag );
                    cfx.log( '  [fgreen]' + flag + '[re] '
                        + ( data ? data.desc : 'Unknown flag' ) );
                }
            }
        }

        // Precheck command execution
        const before = await cmd.before();
        if ( before === true ) {

            // Fire the command
            await cmd.fire();

            // Show completion
            if ( cmd._flag_verbose ) {
                cfx.success( this.options.name + ' command ' + command + ' completed in ' + this.timer.end( 'application-run-verbose' ) );
            }
        } else if ( cmd._flag_verbose ) {
            cfx.success( this.options.name + ' precheck ' + command + ' completed in ' + this.timer.end( 'application-run-verbose' ) );
        }

        // End application process
        if ( xit ) {
            this.exit( 0 );
        }
    }

    /**
     * End process
     * @param {number} code - Exit code, default: 0
     * @param {null|boolean} showTime - Show from construction time
     * @return {void}
     */
    exit( code = 0, showTime = null ) {
        if ( showTime === true || showTime === null && this._flag_verbose ) {
            cfx.info( this.options.name + ' completed after ' + this.timer.end( 'construct' ) );
        }
        process.exit( code );
    }
}

// Export Exception as static property constructor
Application.ApplicationException = ApplicationException;

/**
 * Export
 * @type {Application}
 */
module.exports = Application;
