# id8.Observer( [events:Object] ):id8.Observer
id8.Observer provides the core functionality required to create event-driven applications by allowing you to observe and broadcast custom events within the JavaScript space.

id8.Observer is best utilised as a base class you can extend your own classes with.

## configuration options

### events:Object
An Object of `events` to observe. See the `observe` instance method for details on adding event listeners.

## instance properties

### broadcasting:Boolean|String
Returns `false` if no event is currently being broadcast, otherwise it will be set to the name of the event currently being broadcast.

### destroyed:Boolean
Returns `true` if the Observer instance was destroyed, `false` otherwise.

### events_suspended:Boolean
Returns `true` if the Observer has been suspended from broadcasting events, `false` otherwise.

### events:id8.Hash
The Observer's events listeners store.

## instance methods

### broadcast( event:String[, arg1:Mixed, arg2:Mixed, ..., argN:Mixed] ):id8.Observer
Broadcasts the passed `event` – firing any event listener callbacks observing the `event` being `broadcast` – and passes any extra arguments to the callback Functions.

**IMPORTANT:** The Observer instance broadcasting the event will always be the first argument passed to each callback Function; **UNLESS** The callback Function is a method on the Observer instance.

#### Example:

```javascript

    function log() { console.log( 'log function: ', arguments ); }

    var observer = id8.Observer.create();

    observer.log = function() { console.log( 'log method:   ', arguments ); }

    observer.observe( 'foo', log )
            .observe( 'foo', observer.log, observer )
            .broadcast( 'foo', 1, 2, 3 );

    // logs => log function: [observer, 1, 2, 3]; <- Observer instance that broadcast the event is the first argument as log function does not exist on observer
    // logs => log method:   [1, 2, 3];           <- Observer instance omitted, as log method exists on observer

```

### destroy():Boolean
Destroys the Observer instance, purging all event listeners and disabling the Observer instance from broadcasting any more events.

Returns `true` if the Observer instance is successfully destroyed, `false` otherwise.

**IMPORTANT:** If you are extending `id8.Observer` it is **best practice** to override the `_destroy` method rather than the `destroy` method, to ensure the `before:destroy` & `destroy` events are broadcast at the correct times.

#### Example:

```javascript

    function log() { console.log( arguments ); }

    var observer = new id8.Observer( { foo : log } );

    observer.broadcast( 'foo', 1, 2, 3 ); // logs    => log function: [observer, 1, 2, 3];

    observer.destory();                   // returns => true

    observer.broadcast( 'foo', 1, 2, 3 ); // does nothing, observer is destoryed

    observer.observe( 'foo', log );            // throws  => TypeError: this.events is undefined.

```

### ignore( event:String, callback:Function|id8.Callback[, context:Object] ):id8.Observer
Removes the passed `callback' Function – or id8.Callback instance – from the listener queue, so that it is no longer fired when the Observer broadcasts the passed `event`.

#### Example:

```javascript

    function log() { console.log( arguments ); }

    var observer = id8.Observer.create( { foo : log } );

    observer.broadcast( 'foo', 1, 2, 3 ); // logs => [observer, 1, 2, 3];

    observer.ignore( 'foo', log );

    observer.broadcast( 'foo', 1, 2, 3 ); // does nothing, the observer was removed;

```

### observe( event:Object|String[, callback:Function|Function\[\]|String|String\[\]|id8.Callback|id8.Callback\[\], context:Object, options:Boolean|Number|Object] ):id8.Observer
Observes the Observer instance based on the passed parameters.

Allows you to add a single event listener callback – or multiple callbacks – for a single event; or an Object containing a number of event listeners for multiple events and multiple event listener callbacks.

When adding event listeners you can also give an optional `options` Object, the **optional** parameters it accepts are:

<table border="0" cellpadding="0" cellspacing="0">
	<thead><tr><th>option</th><th>type</th><th>description</th></tr></thead>
	<tbody>
		<tr><td>args</td><td>Array</td><td>If supplied, these arguments will be prepended to the arguments passed to each event listener callback.</td></tr>
		<tr><td>buffer</td><td>Number</td><td>If supplied, the event listener callback will only be executed once during the specified number of milliseconds.<br />
        This is handy for events that could fire hundreds or thousands of times in a second – but do not need to be executed each time – ensuring your application's performance does not suffer because of this.</td></tr>
		<tr><td>delay</td><td>Number</td><td>If supplied, the event listener will be executed after being delayed by the specified number of milliseconds.</td></tr>
		<tr><td>single</td><td>Boolean</td><td>If supplied, the event listener callbackk will only be executed once and then removed.</td></tr>
	</tbody>
</table>

This is all best explained by examples. First let us define an example Observer class and a couple of instances:

```javascript

    id8.Class( 'ObserverExample', {
       extend      : id8.Observer,
       constructor : function( id, events ) {
          this.id = id;
          this.parent( events );
       },
       log         : function() { console.log( this.id, ': ', arguments ); },
       foo         : function() { console.log( this.id, ': foo' ); },
       bar         : function() { console.log( this.id, ': bar' ); }
    } );

    var observer_1 = id8( 'observerexample' ),
        observer_2 = ObserverExample.create();

```

Now let's observe an event:

```javascript

// adding a single event listener and maintaining the correct context
    observer_1.observe( 'foo', observer_2.log );             // <- WRONG: context (this) Object of observer_2.log will be observer_1

    observer_1.observe( 'foo', observer_2.log, observer_2 ); // <- RIGHT: context (this) Object of observer_2.log will be observer_2

```

A little bit smarter, observing an event with multiple listeners:

```javascript

// add multiple event listener callbacks for one event
    observer_1.observe( 'foo', [observer_2.log, observer_2.foo, observer_2.bar], observer_2 );

    observer_1.observe( 'foo', ['log', 'foo', 'bar'], observer_2 );             // <- same as above

```

Adding options into the mix:

```javascript

// fire an event listener once only
    observer_1.observe( 'foo', 'log', observer_2, true );                       // <- can simply pass true if there are no other options
    observer_1.observe( 'foo', observer_2.log, observer_2, { single : true } ); // <- will do same as above

// delay the event listener from firing by the specified number of milliseconds
    observer_1.observe( 'foo', 'log', observer_2, 500 );                        // <- can simply pass the number of milliseconds if there are no other options
    observer_1.observe( 'foo', observer_2.log, observer_2, { delay : 500 } );   // <- will do the same as above

// buffer an event listener to only fire once during the specified number of milliseconds
    observer_1.observe( 'foo', observer_2.log, observer_2, { buffer : 500 } );  // <- only one way to do this one, sorry.

```

Adding event listeners for multiple events using an Object, and whole lot more!

```javascript

// add multiple event listener callbacks for multiple events
    observer_1.observe( {
       foo        : {
          fn      : 'foo',
          ctx     : observer_2,                                      // <- overrides the top level ctx
          options : { args : [1, 2, 3], delay : 250, single : true } // <- overrides the top level options
       },
       bar        : [observer_2.bar, 'log'],                         // <- can still add multiple callbacks for one event
       log        : observer_2.log,
       ctx        : observer_2,                                      // <- top level ctx for all callbacks which don't have one specified
       options    : { args : [4, 5, 6 ] }                            // <- top level options for all callbacks which don't have any specified
    } );

```

Using a `id8.Callback` as an event listener

```javascript

   var cb = id8.Callback( function() {
      console.log( this, arguments );
   }, { args : [1, 2, 3], ctx : { foo : 'bar' } } );

   observer_1.observe( 'foo', cb );          // <- we pass the Callback Object, NOT its fire Function, the Observer handles this internally

   observer_1.broadcast( 'foo', 4, 5, 6 );   // cb will log => {"foo":"bar"}, [observer_1, 1, 2, 3, 4, 5, 6] <-

   cb.disable();

   observer_1.broadcast( 'foo', 4, 5, 6 );   // does nothing, cb is disabled

   cb.enable();

   observer_1.broadcast( 'foo', 7, 8, 9 );   // cb will log => {"foo":"bar"}, [observer_1, 1, 2, 3, 7, 8, 9]

```

**NOTE:** when using a `id8.Callback` with a `id8.Observer`, the `id8.Callback` instance will resolve the callback arguments to ensure the `id8.Observer` instance is always the first parameter passed to its underlying Function.

**NOTE:** you can also supply wildcard (*) event listeners:

```javascript

   observer_1.observe( '*foo*', console.log, console );

   observer_1.broadcast( 'foo', 1, 2, 3 );          // <= fires *foo* listener callback

   observer_1.broadcast( 'ipitythefool', 1, 2, 3 ); // <= fires *foo* listener callback

   observer_1.broadcast( 'foomanchu', 1, 2, 3 );    // <= fires *foo* listener callback

   observer_1.broadcast( 'foomanchu', 1, 2, 3 );    // <= fires *foo* listener callback

   observer_1.broadcast( 'boofuu', 1, 2, 3 );       // <= DOES NOT fire *foo* listener callback

```

### purgeObservers( [event:String] ):id8.Observer
Removes all an Observer instance's event listeners. If an `event` is passed, only the event listeners for that `event` will be removed.

### relayEvents( observer:id8.Observer, event1:String[, event2:String, ..., eventN:String] ):id8.Observer
Relays the passed `event`s from the Observer instance to the passed `observer`, as if the events are also being broadcast by the passed `observer`.

Handy for implementing "event bubbling" like functionality.

### resumeEvents():id8.Observer
Enables the Observer instance's ability to `broadcast` events.

See `suspendEvent` example below.

### suspendEvents():id8.Observer
Disables the Observer instance's ability to `broadcast` events.

#### Example:

```javascript

    function log() { console.log( arguments ); }

    var observer = id8.Observer.create( { foo : log } );

    observer.broadcast( 'foo', 1, 2, 3 ); // logs => [observer, 1, 2, 3];

    observer.suspendEvents();

    observer.broadcast( 'foo', 1, 2, 3 ); // does nothing, events are suspended

    observer.resumeEvents();

    observer.broadcast( 'foo', 1, 2, 3 ); // logs => [observer, 1, 2, 3];

```

