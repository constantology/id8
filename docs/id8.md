# id8( type_or_path:String[, param1:Mixed, param2:Mixed, ..., param3:Mixed ):
id8 itself is a factory method you can use to create an instance of an [id8.Class](/constantology/id8/docs/id8.Class.md).

You can either supply the either the `path` or the `type` used when the Class was created as the first parameter.

If the Class is registered with id8.Class it will pass all other arguments to the Class' `create` factory and return an instance of the Class.

If no `type` or `path` is registered an Error will be thrown.

**NOTE:** Classes that live under the `id8` namespace can have the `id8_` omitted from their type.

## Example:

```javascript

   var hash1 = id8( 'hash',     { foo : 'bar' } ),
       hash2 = id8( 'id8_hash', { foo : 'bar' } );
       hash3 = id8( 'id8.Hash', { foo : 'bar' } );

   m8.type( hash1 ); // returns => "id8_hash"

   m8.type( hash2 ); // returns => "id8_hash"

   m8.type( hash3 ); // returns => "id8_hash"

   hash1.valueOf();  // returns => { "foo" : "bar" }

   hash2.valueOf();  // returns => { "foo" : "bar" }

   hash3.valueOf();  // returns => { "foo" : "bar" }

```

## id8.is( instance:Object, Class:id8.Class ):Boolean
Returns `true` if the passed `instance` is an instance of the passed `class`.

### Example:

```javascript

   var Foo = id8.Class( {
          constructor : function() {}
       } ),
       Bar = id8.Class( {
          constructor : function() {},
          extend      : Foo
       } );

   var foo = new Foo,
       bar = new Bar;

       foo instanceof Foo  // returns => true
       foo instanceof Bar  // returns => false

       bar instanceof Bar  // returns => true
       bar instanceof Foo  // returns => false, should be true though

       id8.is( foo, Foo ); // returns => true
       id8.is( foo, Bar ); // returns => false

       id8.is( bar, Bar ); // returns => true
       id8.is( bar, Foo ); // returns => true

```

## id8.type( instance:Object ):String
Returns the path parameter – if it was used when creating a `id8.Class` – of a `id8.Class` instance.

### Example:

```javascript

   var Foo = id8.Class( {
          constructor : function Foo() {}
       } ),
       Bar = id8.Class( 'path.to.Bar', {
          constructor : function Bar() {},
          extend      : Foo
       } );

   var foo = new Foo,
       bar = new Bar;

   id8.type( foo ); // returns => "Foo"
   id8.type( bar ); // returns => "path.to.Bar"

// this differs from m8.type:
   m8.type( foo );  // returns => "foo"
   m8.type( bar );  // returns => "path_to_bar"

```

# Extensions to JavaScript Natives
Because it's never complete without at least one!

## Function.prototype.callback( configuration:Object ):Function
Creates an instance of id8.Callback and returns it's `fire` method. The id8.Callback instance is available via `fire.cb`.

#### Example:

```javascript

   function foo() { console.log( this, arguments ); }

   var foo_callback = foo.callback( { args : [1, 2, 3], ctx : { foo : 'bar' }, delay : 500, times : 1 } );

   foo_callback( 4, 5, 6 )               // waits   => 500ms
                                         // logs    => { "foo" : "bar" } [1, 2, 3, 4, 5, 6]

   foo_callback()                        // returns => undefined; times parameter set to 1

   foo_callback.cb                       // returns => id8.Callback instance

   foo_callback.cb.fire === foo_callback // returns => true

```

## Object.key( object:Object, value:Mixed ):String
Returns the `object`'s property `key` for the passed `value` if `value` is a property of `object`. If not `null` is returned.

**NOTE:** `value` is determined based on the `===` operator.

#### Example:

```javascript

   var foo = { one : 1, two : 2, three : 3 };

   Object.key( foo, 2 ); // returns => "two"

   Object.key( foo, 4 ); // returns => null

```

## Object.remove( object:Object, property1:String|String[][, property2:String, ..., propertyN:String] ):Object
Removes each `key` from the passed `object` and returns `object`.

#### Example:

```javascript

   var foo = { one : 1, two : 2, three : 3 };

   Object.remove( foo, 'one', 'three' );   // returns => { two : 2 }

   Object.remove( foo, ['one', 'three'] ); // same as above

```
