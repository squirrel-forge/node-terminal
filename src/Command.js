/* global require, module, process */
'use strict';

/**
 * Requires
 */
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const objm = require( '@squirrel-forge/node-objection' );
const Terminal = require( './Terminal' );

/**
 * Command class
 *
 * @abstract
 */
class Command extends Terminal {

    /**
     * Constructor
     *
     * @param {Object} app - Application
     * @param {Object} options - Options object
     */
    constructor( app, options ) {

        // Call super constructor
        super();
        this.timer.start( 'command-construct' );

        // Set references
        this._app = app;

        // Default _options
        this._defaults = {
            name : '[no name]',
            desc : '[no description]',

            // Arguments must be ordered and handled by index position
            args : [

                // [ 'type', 'name', 'description' ]
            ],

            // Flags are boolean values, default is always false
            flags : [

                // [ '-short', '--long', 'description' ]
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

        // Set known flags as properties
        this.setFlagProps( this, this._options.flags, this._app._flags );
    }

    /**
     * Get argument by index
     *
     * @param {number} no - Argument index
     *
     * @return {*|null} - Argument value or null
     */
    arg( no ) {
        return super.arg( no, this._options.args, this._app._args );
    }

    /**
     * Describe the command
     *
     * @return {void}
     */
    describe() {

        // Name and description
        cfx.success( 'Describing command: ' + this._options.name );
        cfx.log( '\n ' + this._options.desc );

        // Inject after description
        const after_head = '_describe_after_head';
        if ( typeof this[ after_head ] === 'function' ) {
            this[ after_head ]();
        }

        // Show args and flags
        this._printArgs( this._options.args );
        this._printFlags( this._options.flags );
        cfx.log( '' );

        // Inject after args and flags
        const after_desc = '_describe_after_desc';
        if ( typeof this[ after_desc ] === 'function' ) {
            this[ after_desc ]();
        }
    }

    /**
     * Validate command execution
     *
     * @return {boolean} - True if command should be executed
     */
    before() {
        if ( this._flag_describe ) {
            this.describe();
            return false;
        }
        return true;
    }

    /**
     * Fire command
     *
     * @abstract
     *
     * @param {Function} done - Complete callback
     *
     * @return {void}
     */
    fire( done ) {
        throw Error( cfx.setStyle( '[bred][fwhite]  Command class must include a valid "fire" method  [re]' ) );
    }

}

/**
 * Export
 * @type {Command}
 */
module.exports = Command;
