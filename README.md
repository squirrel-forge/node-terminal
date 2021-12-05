# node-terminal

A node commandline abstraction, application wrapper and commands.

## Installation

```
npm i @squirrel-forge/node-terminal

```

## Usage

```
const { Class } = require( '@squirrel-forge/node-terminal' );
```

### Classes

 - Application( options, init )
   - timer : Timer
   - options : Object
   - input : CliInput
   - progress : Progress
   - setInputProps( target, flags )
   - register ( constructor )
   - getCommandName( name )
   - getCommandInstance( constructor, options )
   - run( options, exit )
   - exit( code, time )
 - Command( app, options )
   - app : Application
   - options : Object
   - argData( index )
   - flagData( flag )
   - getDefaultString( def )
   - describe()
   - before()
   - fire()
 - HelpCommand( app ) extends Command
   - fire()

## Docs

Check the sourcecode on [github](https://github.com/squirrel-forge/node-terminal) for extensive comments.
