# id8.Class( [path:String, ]descriptor:Object ):id8.Class
`id8.Class` – as the name suggests – is a convenience method for creating "JavaScript Classes" which mimic classical inheritance: while maintaining the advantages of prototypical inheritance.

`id8.Class` accepts two parameters. An **optional** parameter – `path`, which should always be the first parameter, if supplied – defining the name and namespace of the Class, e.g. `id8.Observer` would create a Class called `Observer` under the `id8` namespace. If no `path` is specified, then the Class is simply returned by the `id8.Class` method.

The `descriptor` parameter is mandatory and can be either the first parameter – if no `path` is given – or the second.

The `descriptor` Object will contain all your properties and methods which will be added to your Class' prototype.

The `descriptor` Object also accepts property descriptors as defined for use with [Object.defineProperty](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty), see the code for [id8.Hash](https://github.com/constantology/id8/blob/master/src/id8.Hash.js) for an example of using property descriptors in your `id8.Class` descriptor.

## default descriptor options
The descriptor has the following **reserved** property names:

<table border="0" cellpadding="0" cellspacing="0" width="100%">
	<thead><tr><th>property</th><th>type</th><th>description</th></tr></thead>
	<tbody>
		<tr><td width="128">constructor</td><td width="96">Function</td><td>This Class' constructor. This is the method that is called when you do: <code>new Foo</code>.</td></tr>
		<tr><td>extend</td><td>Class|String</td><td><strong>OPTIONAL</strong>. If you want to inherit the properties and methods from an existing Class you reference the Class here.</td></tr>
		<tr><td>mixin</td><td>Object</td><td><strong>OPTIONAL</strong>. An Object of properties and methods to mix into the Class' prototype.</td></tr>
		<tr><td>module</td><td>Object</td><td><strong>OPTIONAL</strong>. If you're building functionality to run within Node, then you may fall into issues with your Class' namespace <code>path</code> being <code>bless</code>ed on <code>m8</code>'s Module, rather than your Class' Module. See <strong>Assigning the correct module</strong> below for more information on getting around this.</td></tr>
		<tr><td>chain</td><td>Boolean</td><td><strong>OPTIONAL</strong>. Unless this is set explicitly to <code>false</code>, the id8.Class instance will return its context – <code>this</code> – Object whenever an instance method of a id8.Class returns <code>undefined</code>.</td></tr>
		<tr><td>singleton</td><td>Mixed</td><td><strong>OPTIONAL</strong>. Whether or not this Class is a <a href="http://en.wikipedia.org/wiki/Singleton_pattern">Singleton</a>.<br />
		If you want a Singleton set this property to be either <code>true</code> or to an Array of arguments you wish to pass to the constructor Function.<br />
		<strong>NOTE:</strong> <code>id8.Class</code> will internally resolve any attempt to create a new instance of the singleton by simply returning the existing singleton instance.</td></tr>
		<tr><td>type</td><td>String</td><td><strong>OPTIONAL</strong>. The type you want your Class instances to return when they are passed to <code>Object.type</code>.<br />
		If you pass a <code>path</code> to <code>id8.Class</code> then the <code>type</code> will be created from this.<br />
		However, if a <code>type</code> is also supplied it will overwrite the <code>type</code> created from the <code>path</code>.</td></tr>
		<tr><td>parent</td><td>Function</td><td>This is a special reserved method for calling <code>super</code> methods. Since <code>super</code> is a reserved word in JavaScript, <code>parent</code> has been used in its place.</td></tr>
	</tbody>
</table>

## id8.Class methods
These are the methods available on a newly created `id8.Class`

### create( [arg1:Mixed, arg2:Mixed, ..., argN:Mixed] ):ClassInstance
A `create` factory method is added to your Class constructor to allow you to:

- create an instance of a class using an arbitrary number of arguments; or
- not have to use the `new` constructor – if you're one of those developers who thinks it's some type of JavaScript faux pas to use the `new` constructor.

See the **id8.Class Examples** below on how to create `id8.Class` instances using the `create` factory on your class or the global `id8` factory.

See the **long winded argument** below to (hopefully) answer any questions or complaints you have regarding mimicing classical inheritance in JavaScript.

## instance properties

### this.__super
If by any chance you require access to a super class' methods or properties, you can access them from the `__super` property on your Class instance.

The `__super` property is read only and is available on the Class `constructor` as well as instances of a Class. See the **id8.Class examples** below for examples.

## instance methods

### this.parent()
When you create an instance of a Class created with `id8.Class` you can access the `super` method of a Class you are extending by calling:

```javascript

   this.parent( arg1, arg2, ..., argN );

```

Context will be maintained correctyl, unless you use Function `.call` or `.apply`. In which case you should pass the context in as normal.

#### Example

```javascript

   this.parent.call( this, arg1, arg2, ..., argN );

// or

   this.parent.apply( this, [arg1, arg2, ..., argN] );

```

## Assigning the correct module
If you are using `id8.Class` to create a "JavaScript Class" within a Commonjs Module and you are using the `path` parameter to assign that Class to a namespace, it is important to remember that when the namespace is `bless`ed – using [m8.bless](/constantology/m8) – it will either be assigned to the Module executing the `bless` code – i.e. `m8`.

As mentioned above you can supply the Module instance you want your Class and namespace to be created on. However, you may want the full namespace in your Class' `path` so that you can correctly access it later using the `id8` factory method.

This is simple to do, simply insert a carat `^` at the beginning of your Class' `path` and assign the correct Module instance to the Class' `module` property. The rest is handled internally.

### Example

#### The wrong way:

```javascript

   var id8 = require( 'id8' ),
       m8  = id8.m8.x( Object, Array, Boolean, Function ); // local reference to m8 and extend Native Types if sandboxed.

	var path = module.exports = {}; // base namespace for our module

// WRONG: assigns to Foo Class to m8's Module instance, will be accessible via m8.path.to.Foo
//        Foo instance types will be path_to_foo
   id8.Class( 'path.to.Foo', {
       constructor : function() {}
   } );

// WRONG: assigns Foo Class to this module as module.exports.path.to.Foo or path.path.to.Foo
//        Foo instance types will be path_to_foo
   id8.Class( 'path.to.Foo', {
       constructor : function() {},
       module      : module
   } );

// WRONG: assigns Foo Class to this module as module.exports.to.Foo or path.to.Foo, which is ALMOST what we want,
//        Foo instance types will be to_foo instead of path_to_foo
   id8.Class( 'to.Foo', {
       constructor : function() {},
       module      : module
   } );

```

#### The correct way:

```javascript

   var id8 = require( 'id8' ),
       m8  = id8.m8.x( Object, Array, Boolean, Function ); // local reference to m8 and extend Native Types if sandboxed.

	var path = module.exports = {}; // base namespace for our module

// CORRECT: assigns Foo Class to this module as module.exports.to.Foo or path.to.Foo
//          path.to.Foo instance types will be path_to_foo
//          this WILL NOT work correctly in a browser though as there is no Module class
   id8.Class( '^path.to.Foo', {
       constructor : function() {},
       module      : module
   } );

// CORRECT: assigns Foo Class to this module as module.exports.to.Foo or path.to.Foo
//          path.to.Foo instance types will be path_to_foo
//          this will also work in node and in a browser
   id8.Class( '^path.to.Foo', {
       constructor : function() {},
       module      : path
   } );

// CORRECT: assigns Foo Class to this module as module.exports.to.Foo or path.to.Foo
//          path.to.Foo instance types will be path_to_foo
//          this will also work in node and in a browser
   id8.Class( '^path.to.Foo', {
       constructor : function() {},
       module      : m8.ENV == 'commonjs' ? module : null
   } );

```

## id8.Class examples:

```javascript

   id8.Class( 'Foo', {
      constructor : function( greeting ) {
         this.greeting = greeting;
         this.setNum( 10 );
      },
      getNum      : function() { return this.num; },
      setNum      : function( num ) { return ( this.num = num ); }
   } );

   id8.Class( '^path.to.Bar', {
      constructor : function( greeting ) { this.parent( 'bar: ' + greeting, true ); },
      extend      : Foo,
      module      : m8.ENV === 'commonjs' ? module : null,
      getNum      : function() { return this.parent(); }
   } );

   var Zaaz = id8.Class( {
      constructor : function( greeting ) { this.parent( 'zaaz: ' + greeting, true ); },
      extend      : path.to.Bar
   } );

   var foo  = new Foo( 'hello world!' ),
       bar  = id8( 'path.to.Bar', 'hello world!' ),
       zaaz = Zaaz.create.apply( this, ['hello world!'] );

   foo.greeting;              // returns => "hello world!"
   foo.getNum()       === 10  // returns => true
   foo.setNum( 100 )  === 100 // returns => true
   foo.getNum()       === 100 // returns => true

   bar.greeting;              // returns => "bar: hello world!"
   bar.getNum()       === 10  // returns => true
   bar.setNum( 200 )  === 200 // returns => true
   foo.getNum()       === 100 // returns => true

   zaaz.greeting;             // returns => "bar: zaaz: hello world!"
   zaaz.getNum()      === 10  // returns => true
   zaaz.setNum( 400 ) === 400 // returns => true

   foo.__super.constructor          === Object // returns => true
   bar.__super.constructor          === Foo    // returns => true
   zaaz.__super.constructor         === Bar    // returns => true
   zaaz.__super.__super.constructor === Foo    // returns => true

   bar.__super         === path.to.Bar.__super // returns => true
   bar.__super.__super === Foo.__super         // returns => true

```

# The long winded argument...

## Classical inheritance sucks!
If this describes your attitude to the whole JavaScript Classes thing, then think about why you are saying this.

Is it because someone else has said it and you take their word as gospel or is there a real reason you think creating highly reusable code with single points of failure is a bad thing?

Classical inheritence is a design pattern like Deccorator, Factory, MVC, etc, etc. It has its purpose, you don't need a Class for everything of course, however if you're building large scale applications Classes have proven to be very handy for abstracting out reusable functionality.

### Testing and bug fixing are a b!+ch
As a design pattern: having a method that creates your classical inheritance like structure for you can aleviate the potential for various types silly bugs portentially caused by moving functionality around and renaming classes and methods.
Consider the following:

```javascript

// file: my/weird/package/Foo.js
   my.weird.package.Foo = function( value ) { this.value = value; }

   my.weird.package.Foo.prototype.setValue = function( value ) { this.value = value; };

// file: my/other/package/Bar.js
   my.other.package.Bar = function( id, value ) {
      my.weird.package.Foo.prototyope.constructor.call( this, value );
      this.id = id;
   }

   my.other.package.Bar.prototype.setValue = function( value ) {
      switch ( typeof value ) {
         case 'number' : this.value = value * 10; break;
         default       : my.weird.package.Foo.prototype.setValue.call( this, value );
      }
   };

```

Apart from the repetition and general fugliness of this code, it all looks perfectly sane, right?

Consider we copy `my.weird.package.Foo` to `my.crazy.package.Foo` and we want `my.other.package.Bar` to inherit from `my.crazy.package.Foo` instead, as the functionality in `my.weird.package.Foo` will be changing.

This is a simple example so there are only two super methods we need to change, however, the more functionality you write in this way and the more developers you have working with the same codebase, the more chances there are of something going wrong; the greater the amount of tests you need to write to make sure everything is being called correctly.

Yet, even with massive amounts of pointless tests, you could accidentally miss something out – like forgetting to change one of `Bar`'s super method calls – your tests may still pass, yet there may be certain edge cases which can cause nasty behaviour in your production environment which could be near impossible to trace.

Abstracting all this out into a reusable component does not only give you a smaller, more readable codebase to work with; it's simply a much safer option: having a single point of failure to debug is much better than potentially hundreds.

### Ecma.next
Classes are even proposed in the [ecma harmony](http://wiki.ecmascript.org/doku.php?id=harmony:classes) and [ecma](http://wiki.ecmascript.org/doku.php?id=strawman:class_operator) [strawman](http://wiki.ecmascript.org/doku.php?id=strawman:minimal_classes) [wiki](http://wiki.ecmascript.org/doku.php?id=strawman:maximally_minimal_classes).

## It's not OOJS, use `Object.create()` instead!
For the record, `id8.Class` uses `Object.create()` internally.

However, in case you did not realise, or are quoting someone else without understanding the problem(s) and solution(s).

`Object.create()` **does not** handle calling a constructor function **or** super methods. Yes you can use and reuse Objects as prototypes – we can do this without `Object.create()` too – but it is not the same as sub-classing and definitely nowhere near as powerful.
If it where then I would not have written a `id8.Class`.

