/* global module, require */
'use strict';

/**
 * Export
 * @type {{Timer: Timer, Command: Command, HelpCommand: HelpCommand, Application: Application, Terminal: Terminal}}
 */
module.exports = {
    Application : require( './src/Application' ),
    Command : require( './src/Command' ),
    HelpCommand : require( './src/HelpCommand' ),
    Terminal : require( './src/Terminal' ),
    Timer : require( './src/Timer' ),
};
