/* global require, module */
'use strict';

/**
 * Requires
 */
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const Command = require( './Command' );

/**
 * Help command
 */
class HelpCommand extends Command {

    /**
     * Constructor
     *
     * @param {Object} app - Application
     *
     * @return {void}
     */
    constructor( app ) {
        super( app, {
            name : 'help',
            desc : 'Shows a list of all registered commands and some general information.',
        } );
    }

    /**
     * Fire command
     *
     * @param {Function} done - Complete callback
     *
     * @return {void}
     */
    fire( done ) {
        cfx.success( this._app._options.name + ': Help' );

        // Inject after description
        const after_head = 'inject_after_head';
        if ( typeof this[ after_head ] === 'function' ) {
            this[ after_head ]();
        }

        // Global flags
        this._printFlags( this._app._options.flags, '\n Global flags:' );

        // Inject after description
        const after_flags = 'inject_after_flags';
        if ( typeof this[ after_flags ] === 'function' ) {
            this[ after_flags ]();
        }

        // Sorted commands
        cfx.log( '\n Commands:' );
        const keys = Object.keys( this._app._commands );
        keys.sort();
        var i, cmd;
        for ( i = 0; i < keys.length; i++ ) {
            cmd = new this._app._commands[ keys[ i ] ]( this._app );
            cfx.log( '   [fgreen]' + cmd._options.name + '[re]' +
                ( this._flag_verbose ? ' [[fcyan]class[re]][fcyan]' + cmd.constructor.name + '[re]' : '' ) +
                ' : ' + cmd._options.desc );
        }

        // Inject after description
        const after_com = 'inject_after_com';
        if ( typeof this[ after_com ] === 'function' ) {
            this[ after_com ]();
        }

        cfx.log( '' );
        done();
    }

}

module.exports = HelpCommand;
