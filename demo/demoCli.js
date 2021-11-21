/**
 * Requires
 */
const cfx = require( '@squirrel-forge/node-cfx' ).cfx;
const CliInput = require( '@squirrel-forge/node-util' ).CliInput;

/**
 * Cli application
 * @return {Promise<void>} - Possibly throws errors in strict mode
 */
module.exports = async function demoCli() {

    // Input
    const input = new CliInput( cfx );

    // Main arguments
    const first_argument = input.arg( 0 ) || '';

    // Cli application options
    const options = input.getFlagsOptions( {

        // Show more output
        verbose : [ '-i', '--verbose', false, true ],

    } );

    // Run
    cfx.success( 'This was your input:' );
    console.log( { first_argument, options } );

    // End application
    process.exit( 0 );
};
