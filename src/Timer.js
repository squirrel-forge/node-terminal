/* global require, module, process */
'use strict';

/**
 * Timer class
 */
class Timer {

    /**
     * Constructor
     */
    constructor() {
        this._times = {};
        this.start( 'construct' );
    }

    /**
     * Start timer
     *
     * @param {string} name - Timer name
     *
     * @return {void}
     */
    start( name ) {
        this._times[ name ] = process.hrtime();
    }

    /**
     * End timer
     *
     * @param {string} name - Timer name
     *
     * @return {string} - Time result
     */
    end( name ) {
        const cmd_time = process.hrtime( this._times[ name ] );
        return ( cmd_time[ 0 ] ? cmd_time[ 0 ] + 's ' : '' ) + ( cmd_time[ 1 ] / 1000000 ) + 'ms';
    }

}

/**
 * Export
 * @type {Timer}
 */
module.exports = Timer;
