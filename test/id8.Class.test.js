typeof id8  !== 'undefined' || ( id8  = require( 'id8' ) );
typeof chai !== 'undefined' || ( chai = require( 'chai' ) );

m8     = id8.m8;
expect = chai.expect;

suite( 'id8.Class', function() {

	var mod         = m8.ENV != 'commonjs' ? null : module, // module to assign classes to if commonjs module
// class definitions
		Class_01    = id8.Class( {
			constructor : function( greeting ) {
				this.greeting = greeting;
				this.setNum( 10 );
			},
			type        : 'loremipsum',
			getNum      : function() { return this.num; },
			setNum      : function( num ) {
				this.num = num;
				return this.getNum();
			}
		} ),
		Class_02    = id8.define( 'path.to.Class_02', {
			constructor : function( greeting ) { this.parent( 'class_02: ' + greeting ); },
			extend      : Class_01,
			module      : mod,
			getNum      : function() { return this.parent(); }
		} ),
		Class_03    = id8.define( 'Class_03', {
			constructor : function( greeting ) { this.parent( 'class_03: ' + greeting ); },
			extend      : 'path.to.Class_02',
			module      : mod
		} ),
		Class_04    = id8.Class( {
			constructor : function Class_04( greeting ) { this.parent( 'class_04: ' + greeting ); },
			extend      : Class_03,
			mixin       : { implemented : function() { return true; } },
			getNum      : function() {
				return this.parent();
			}
		} ),
// instances
		instance_01 = new Class_01( 'hello world!' ),
		instance_02 = id8( 'path.to.Class_02', 'hello world!' ),
		instance_03 = Class_03.create.call( this, 'hello world!' ),
		instance_04 = Class_04.create.apply( this, ['hello world!'] ),
// base namespace for test classes
		path        = mod ? module.exports.path : m8.global.path;

	id8.define( 'path.to.Singleton_01', {
		constructor : function() { this.parent( 'singleton_01: hello world!' ); },
		extend      : Class_04,
		module      : mod,
		singleton   : true,
		getNum      : function() { return this.parent(); }
	} );

	test( '<static> id8.is', function( done ) {
		expect( id8.is( instance_01, Class_01 ) ).to.be.true;
		expect( id8.is( instance_01, Object ) ).to.be.true;

		expect( id8.is( instance_02, Class_02 ) ).to.be.true;
		expect( id8.is( instance_02, Class_01 ) ).to.be.true;
		expect( id8.is( instance_02, Object ) ).to.be.true;

		expect( id8.is( instance_03, Class_03 ) ).to.be.true;
		expect( id8.is( instance_03, Class_02 ) ).to.be.true;
		expect( id8.is( instance_03, Class_01 ) ).to.be.true;
		expect( id8.is( instance_03, Object ) ).to.be.true;

		expect( id8.is( instance_04, Class_04 ) ).to.be.true;
		expect( id8.is( instance_04, Class_03 ) ).to.be.true;
		expect( id8.is( instance_04, Class_02 ) ).to.be.true;
		expect( id8.is( instance_04, Class_01 ) ).to.be.true;
		expect( id8.is( instance_04, Object ) ).to.be.true;

		expect( id8.is( path.to.Singleton_01, path.to.Singleton_01.constructor ) ).to.be.true;
		expect( id8.is( path.to.Singleton_01, Class_04 ) ).to.be.true;
		expect( id8.is( path.to.Singleton_01, Class_03 ) ).to.be.true;
		expect( id8.is( path.to.Singleton_01, Class_02 ) ).to.be.true;
		expect( id8.is( path.to.Singleton_01, Class_01 ) ).to.be.true;
		expect( id8.is( path.to.Singleton_01, Object ) ).to.be.true;

		done();
	} );

	test( '<static> id8.type', function( done ) {
		expect( id8.type( instance_01 ) ).to.eql( 'Anonymous' );
		expect( id8.type( instance_02 ) ).to.eql( 'path.to.Class_02' );
		expect( id8.type( instance_03 ) ).to.eql( 'Class_03' );
		expect( id8.type( path.to.Singleton_01 ) ).to.eql( 'path.to.Singleton_01' );
		expect( id8.type( instance_04 ) ).to.eql( 'Class_04' );

		done();
	} );

	test( 'instantiating with the new operator', function( done ) {
		var f, b, z, w;
		expect( ( f = new Class_01( 'hello world!' ) ) instanceof Class_01 ).to.be.true;
		expect( f.greeting ).to.eql( 'hello world!' );
		expect( ( b = new Class_02( 'hello world!' ) ) instanceof id8.get( 'path-to-class_02' ) ).to.be.true;
		expect( b instanceof Class_01 ).to.be.true;
		expect( b.greeting ).to.eql( 'class_02: hello world!' );
		expect( ( z = new Class_03( 'hello world!' ) ) instanceof id8.get( 'Class_03' ) ).to.be.true;
		expect( z instanceof Class_02 ).to.be.true;
		expect( z instanceof Class_01 ).to.be.true;
		expect( z.greeting ).to.eql( 'class_02: class_03: hello world!' );
		expect( ( w = new Class_04( 'hello world!' ) ) instanceof Class_04 ).to.be.true;
		expect( w instanceof Class_03 ).to.be.true;
		expect( w instanceof Class_02 ).to.be.true;
		expect( w instanceof Class_01 ).to.be.true;
		expect( w.greeting ).to.eql( 'class_02: class_03: class_04: hello world!' );
		expect( path.to.Singleton_01 instanceof path.to.Singleton_01.constructor ).to.be.true;
		expect( path.to.Singleton_01 instanceof Class_04 ).to.be.true;
		expect( path.to.Singleton_01 instanceof Class_03 ).to.be.true;
		expect( path.to.Singleton_01 instanceof Class_02 ).to.be.true;
		expect( path.to.Singleton_01 instanceof Class_01 ).to.be.true;

		done();
	} );

	test( 'instantiating without the new operator', function( done ) {
		var f, b, z, w;
		expect( ( f = Class_01( 'hello world!' ) ) instanceof Class_01 ).to.be.true;
		expect( f.greeting ).to.eql( 'hello world!' );
		expect( ( b = Class_02( 'hello world!' ) ) instanceof Class_02 ).to.be.true;
		expect( b.greeting ).to.eql( 'class_02: hello world!' );
		expect( ( z = Class_03( 'hello world!' ) ) instanceof Class_03 ).to.be.true;
		expect( z.greeting ).to.eql( 'class_02: class_03: hello world!' );
		expect( ( w = Class_04( 'hello world!' ) ) instanceof Class_04 ).to.be.true;
		expect( w.greeting ).to.eql( 'class_02: class_03: class_04: hello world!' );

		done();
	} );

	test( 'instantiating a Class with the Class\' create factory', function( done ) {
		var f, b, z, w;
		expect( ( f = Class_01.create( 'hello world!' ) ) instanceof Class_01 ).to.be.true;
		expect( f.greeting ).to.eql( 'hello world!' );
		expect( ( b = Class_02.create( 'hello world!' ) ) instanceof Class_02 ).to.be.true;
		expect( b.greeting ).to.eql( 'class_02: hello world!' );
		expect( ( z = Class_03.create( 'hello world!' ) ) instanceof Class_03 ).to.be.true;
		expect( z.greeting ).to.eql( 'class_02: class_03: hello world!' );
		expect( ( w = Class_04.create( 'hello world!' ) ) instanceof Class_04 ).to.be.true;
		expect( w.greeting ).to.eql( 'class_02: class_03: class_04: hello world!' );

		done();
	} );

	test( 'instantiating a Class with the id8 factory', function( done ) {
		var f, b, z, w;
		expect( ( b = id8( 'path-to-class_02', 'hello world!' ) ) instanceof Class_02 ).to.be.true;
		expect( b.greeting ).to.eql( 'class_02: hello world!' );
		expect( ( z = id8( 'class_03', 'hello world!' ) ) instanceof Class_03 ).to.be.true;
		expect( z.greeting ).to.eql( 'class_02: class_03: hello world!' );
		expect( ( w = id8( Class_04, 'hello world!' ) ) instanceof Class_04 ).to.be.true;
		expect( w.greeting ).to.eql( 'class_02: class_03: class_04: hello world!' );

		done();
	} );

	test( 'inheritance', function( done ) {
		instance_01.setNum( 10 ); instance_02.setNum( 10 );
		instance_03.setNum( 10 ); instance_04.setNum( 10 );
		path.to.Singleton_01.setNum( 10 );

		expect( instance_01.getNum() ).to.eql( 10 );
		expect( instance_01.setNum( 100 ) ).to.eql( 100 );
		expect( instance_01.getNum() ).to.eql( 100 );

		expect( instance_02.getNum() ).to.eql( 10 );
		expect( instance_02.setNum( 200 ) ).to.eql( 200 );
		expect( instance_01.getNum() ).to.eql( 100 );

		expect( instance_03.getNum() ).to.eql( 10 );
		expect( instance_03.setNum( 400 ) ).to.eql( 400 );
		expect( instance_01.getNum() ).to.eql( 100 );
		expect( instance_02.getNum() ).to.eql( 200 );

		expect( instance_04.getNum() ).to.eql( 10 );
		expect( instance_04.setNum( 800 ) ).to.eql( 800 );
		expect( instance_01.getNum() ).to.eql( 100 );
		expect( instance_02.getNum() ).to.eql( 200 );
		expect( instance_03.getNum() ).to.eql( 400 );

		expect( path.to.Singleton_01.getNum() ).to.eql( 10 );
		expect( path.to.Singleton_01.setNum( 1000 ) ).to.eql( 1000 );
		expect( instance_01.getNum() ).to.eql( 100 );
		expect( instance_02.getNum() ).to.eql( 200 );
		expect( instance_03.getNum() ).to.eql( 400 );
		expect( instance_04.getNum() ).to.eql( 800 );

		done();
	} );

	test( 'singletons', function( done ) {
		expect( new path.to.Singleton_01.constructor() ).to.equal( path.to.Singleton_01 );
		expect( path.to.Singleton_01.constructor() ).to.equal( path.to.Singleton_01 );
		expect( path.to.Singleton_01.constructor.create() ).to.equal( path.to.Singleton_01 );

		done();
	} );

	test( 'type checking', function( done ) {
		expect( m8.type( instance_01 ) ).to.eql( 'loremipsum' );
		expect( m8.type( instance_02 ) ).to.eql( 'path-to-class_02' );
		expect( m8.type( instance_03 ) ).to.eql( 'class_03' );
		expect( m8.type( path.to.Singleton_01 ) ).to.eql( 'path-to-singleton_01' );
		expect( m8.type( instance_04 ) ).to.eql( 'class_04' );

		done();
	} );

	test( 'method overriding', function( done ) {
		var called_getNum = false, called_setNum = false;
		Class_02.override( 'getNum', function() {
			called_getNum = true;
			return this.override();
		} );
		Class_02.override( {
			setNum : function( num ) {
				called_setNum = true;
				num += 100;
				return this.override( arguments );
			}
		} );

		var instance = new Class_02( 'hello' );

		expect( called_getNum ).to.be.true;
		expect( called_setNum ).to.be.true;

		expect( instance.num ).to.equal( 110 );

		called_getNum = false;

		expect( instance.getNum() ).to.equal( 110 );
		expect( called_getNum ).to.be.true;
		expect( instance.getNum() ).to.equal( instance.num );

		called_setNum = false;

		expect( instance.setNum( 100 ) ).to.equal( 200 );

		expect( called_setNum ).to.be.true;

		expect( instance.num ).to.equal( 200 );

		done();
	} );

	test( 'method aliasing', function( done ) {
		id8.Observer.alias( 'observe', 'on' );
		id8.Observer.alias( {
			ignore : 'off'
		} );

		expect( id8.Observer.prototype.observe ).to.equal( id8.Observer.prototype.on );
		expect( id8.Observer.prototype.off ).to.equal( id8.Observer.prototype.ignore );

		done();
	} );
} );
