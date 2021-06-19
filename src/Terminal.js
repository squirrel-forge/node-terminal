/* global require, module, process */
'use strict';

/**
 * Requires
 */
const Spinner = require('cli-spinner').Spinner;
const intercept = require("intercept-stdout");
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const Timer = require( './Timer' );

/**
 * Terminal class
 *
 * @abstract
 */
class Terminal {

    /**
     * Constructor
     */
    constructor() {

        // Timer
        this.timer = new Timer();
        this.timer.start( 'terminal-construct' );

        // Output buffer
        this._endOutputBuffer = null;
        this._outputBuffer = [];

        // Used as internal loading spinner reference
        this._spinner = null;

        // Get and stdin reference and ensure full character input for prompts
        this.stdin = process.stdin;
        this.stdout = process.stdout;

        // Set encoding
        this.stdin.setEncoding( 'utf-8' );
    }

    /**
     * Clean output buffer
     *
     * @return {void}
     */
    ob_clean() {
        this._outputBuffer = [];
    }

    /**
     * End output buffering
     *
     * @return {void}
     */
    ob_end() {
        if ( this._endOutputBuffer ) {
            this._endOutputBuffer();
            this._endOutputBuffer = null;
        }
    }

    /**
     * End and clean output buffer
     *
     * @return {void}
     */
    ob_end_clean() {
        this.ob_clean();
        this.ob_end();
    }

    /**
     * Get output buffer contents and clean buffer
     *
     * @return {Array} - Buffer contents
     */
    ob_get_clean() {
        const buffer = this._outputBuffer;
        this.ob_clean();
        return buffer;
    }

    /**
     * Get output buffer contents
     *
     * @return {Array} - Buffer contents
     */
    ob_get_contents() {
        return this._outputBuffer;
    }

    /**
     * Get output buffer length
     *
     * @return {number} - Number of entries in buffer
     */
    ob_get_length() {
        return this._outputBuffer.length;
    }

    /**
     * Start buffering output
     *
     * @return {void}
     */
    ob_start() {
        this._endOutputBuffer = intercept( text => {
            this._outputBuffer.push( text );
            return '';
        } );
    }

    /**
     * Get argument by index
     *
     * @param {number} no - Argument index
     * @param {Array} setArgs - List of set args [type]
     * @param {Array} args - Args array
     *
     * @return {*|null} - Argument value or null
     */
    arg( no, setArgs, args ) {
        const val = args[ no ];
        if ( setArgs[ no ] ) {

            if ( val !== null && typeof val !== 'undefined' ) {

                switch ( setArgs[ no ][ 0 ] ) {
                    case 'boolean':
                        return [ '1', 'true', 'yes', 'y' ].includes( val );
                    case 'integer':
                        return parseInt( val );
                    case 'float':
                        return parseFloat( val );
                    case 'array':
                        return val.split( ',' );
                    case 'json':
                        try {
                            return JSON.parse( val );
                        } catch ( error ) {
                            cfx.error( error );
                            return null;
                        }
                    default:
                        return val;
                }

            }
        }
        return val || null;
    }

    /**
     * Start progress
     *
     * @param {string} text - Text prefix
     * @param {string} chars - Animation loop
     *
     * @return {void}
     */
    progressStart( text, chars ) {
        this.progressStop();
        chars = chars || '|/-\\';
        this._spinner = new Spinner( ( text ? text + ' ' : '' ) + '%s' );
        this._spinner.setSpinnerString( chars );
        this._spinner.start();
    }

    /**
     * Stop progress
     *
     * @return {void}
     */
    progressStop() {
        if ( this._spinner ) {
            this._spinner.stop( true );
            this._spinner = null;
        }
    }

    /**
     * Async wait via timeout
     */
    wait( timeout ) {
        return new Promise( ( resolve ) => {
            setTimeout( resolve, timeout );
        } );
    }

    /**
     * Start prompting the user
     *
     * @param {boolean} once - Only get input once, default: true
     *
     * @return {Promise<string>}
     */
    prompt( once = true ) {
        return new Promise( ( resolve ) => {
            this.stdin[ once ? 'once' : 'on' ]( 'data', resolve );
        } );
    }

    /**
     * Erase last line
     */
    erase() {
        this.stdout.write( "\x1b[K\x1b[1A\x1b[K" );
    }

    /**
     * End prompt input and command
     *
     * @param {boolean} showTime - Show the default from construction time
     *
     * @return {void}
     */
    exit( showTime = false ) {
        if ( showTime ) {
            cfx.info( 'Completed after ' + this.timer.end( 'construct' ) );
        }
        process.exit();
    }

    /**
     * Set all setFlags as properties
     *
     * @param {Object} context - Target object
     * @param {Array} setFlags - List of setFlags [short,long]
     * @param {Array} flags - Flags array
     *
     * @return {void}
     */
    setFlagProps( context, setFlags, flags ) {
        if ( setFlags.length ) {
            var i, short, long;
            for ( i = 0; i < setFlags.length; i++ ) {
                short = setFlags[ i ][ 0 ];
                long = setFlags[ i ][ 1 ];
                context[ '_flag' + long.replace( /[\-]+/g, '_' ) ] = this.flag( short, long, flags );
            }
        }
    }

    /**
     * Get flag state
     *
     * @param {string} short - Short flag
     * @param {string} long - Long flag
     * @param {Object} flags - Flags object
     *
     * @return {boolean} - Flag state
     */
    flag( short, long, flags ) {
        return flags.includes( short ) || flags.includes( long );
    }

    /**
     * Print arguments
     *
     * @private
     *
     * @param {Array} args - Arguments array
     * @param {string} title - Block title
     *
     * @return {void}
     */
    _printArgs( args, title ) {

        // Show arguments list
        if ( args.length ) {
            cfx.log( title || '\n Arguments:' );
            for ( let i = 0; i < args.length; i++ ) {
                cfx.log( '  [fgreen]' + i + '[re]' +
                    ' [fcyan]' + args[ i ][ 1 ] + '[re]' +
                    ' {[fyellow]' + args[ i ][ 0 ] + '[re]}' +
                    ' : ' + args[ i ][ 2 ] );
            }
        }
    }

    /**
     * Print flags
     *
     * @private
     *
     * @param {Array} flags - Flags array
     * @param {string} title - Block title
     *
     * @return {void}
     */
    _printFlags( flags, title ) {

        // Show flags list
        if ( flags.length ) {
            cfx.log( title || '\n Flags:' );
            for ( let i = 0; i < flags.length; i++ ) {
                cfx.log('  [fgreen]' + flags[ i ][ 0 ] + '[re], [fgreen]' + flags[ i ][ 1 ] + '[re]' +
                    ' : ' + flags[ i ][ 2 ] );
            }
        }
    }
}

/**
 * Export
 * @type {Terminal}
 */
module.exports = Terminal;
