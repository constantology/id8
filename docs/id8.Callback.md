# id8.Callback( callback:Function, configuration:Object ):id8.Callback
A class for easily creating callbacks. Handy for working with event driven architectures.

The `configuration` Object accepts the following OPTIONAL parameters:

<table border="0" cellpadding="0" cellspacing="0" width="100%">
	<thead><tr><th>param</th><th>type</th><th>description</th></tr></thead>
	<tbody>
		<tr><td>args</td><td>Array</td><td>If supplied the items in the Array will be prepended to any more arguments passed to the <code>callback</code> when executed.</td></tr>
		<tr><td>buffer</td><td>Number</td><td>If a Number is given then the <code>callback</code> will only be executed once during the number of milliseconds specified, no matter how many times it is invoked.</td></tr>
		<tr><td>ctx</td><td>Object</td><td>If supplied this will be the context – <strong>this</strong> – of the <code>callback</code> whenever it is executed.</td></tr>
		<tr><td>delay</td><td>Number</td><td>If a Number is given then the <code>callback</code> will be executed after waiting the number of milliseconds specified.</td></tr>
		<tr><td>times</td><td>Number</td><td>If a Number is given and it is greater than zero, the <code>callback</code> will be executed the amount of <code>times</code> specified, afterwhich the <code>callback</code> is disabled.</td></tr>
	</tbody>
</table>

## Examples:

```javascript

   function foo() { console.log( this, arguments ); }

   var foo_ = id8.Callback( foo, {
       args   : [1, 2, 3],
       buffer : 50,
       ctx    : { foo : 'bar' },
       delay  : 25,
       times  : 2
   } );

   foo_.fire( 4, 5, 6 );  // waits 25ms then logs => { "foo" : "bar" }, [1, 2, 3, 4, 5, 6]
// after about 35ms
   foo_.fire();           // does nothing as fired before 50ms buffer is over
// after about 60ms
   foo_.fire( 7, 8, 9 );  // waits 25ms then logs => { "foo" : "bar" }, [1, 2, 3, 7, 8, 9]

   foo_.fire();           // does nothing, already fired 2 times, Callback is disabled

   foo_.fire.cb.reset();  // resets the Callback's counter

   foo_.fire( 4, 5, 6 );  // waits 25ms then logs => { "foo" : "bar" }, [1, 2, 3, 4, 5, 6]

```

## using id8.Callback with DOM Events
id8.Callback implements the [EventListener Interface](http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventListener), you can pass the `id8.Callback` instance as an observer callback for a `id8.Observer` instance or to an `HTMLElement` as an event listener assuming the user agent supports [DOM Level 2 Events](http://www.w3.org/TR/DOM-Level-2-Events/events.html):

So, based on the above example, the following is possible:

```javascript

   document.body.addEventListener( 'click', foo_, false ); // works the same as above, only when document.body is clicked

   // as well as

   window.addEventListener( 'resize', id8.Callback( function( evt ) { // id8.Callback will resolve the callback arguments to ensure the DOM Event is always the first parameter
      // handle window resizing in here
   }, { buffer : 100 } ), false );

```

**NOTE: ** when using a `id8.Callback` with a `id8.Observer` and/ or an `HTMLElement`, the `id8.Callback` instance will resolve the callback arguments to ensure the DOM `Event` or `id8.Observer` instance is always the first parameter passed to its underlying Function.

## instance methods

### disable():this
Disables the Callback, preventing the execution of the underlying `callback` Function.

### enable():this
Enables the Callback, allowing the execution of the underlying `callback` Function based on the specified `configuration` options.

### fire():Mixed
Executes the Callback, taking into account all the specified `configuration` options.

### reset():this
Enables the Callback if disabled and resets the Callback's `count` if configured to only execute a specified Number of `times`.
