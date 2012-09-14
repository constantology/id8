typeof id8  !== 'undefined' || ( id8  = require( 'id8' ) );
typeof chai !== 'undefined' || ( chai = require( 'chai' ) );

m8     = id8.m8;
expect = chai.expect;

suite( 'id8.Source', function() {
	var before_instance_01 = false,
		mod                = {};

	test( 'executing functions after a Class is created', function( done ) {
		var after_define_01 = false, after_define_02 = false;
		id8.define( 'SourceTest_01', {
			constructor    : function SourceTest_01() {
				this.parent( arguments );
			},
			extend         : 'Source',
			module         : mod,
			afterdefine    : function() {
				after_define_01 = true;
			},
			beforeinstance : function() {
				before_instance_01 = true;
			}
		} );

		expect( after_define_01 ).to.be.true;

		after_define_01 = false;
		expect( after_define_01 ).to.be.false;

		id8.define( 'SourceTest_02', {
			extend      : mod.SourceTest_01,
			module      : mod,
			afterdefine : function() {
				after_define_02 = true;
			}
		} );

		expect( after_define_01 ).to.be.true;
		expect( after_define_02 ).to.be.true;

		done();
	} );

	test( 'executing functions before a Class is instantiated', function( done ) {
		var before_instance_02 = false;

		expect( before_instance_01 ).to.be.false;

		id8.define( 'SourceTest_03', {
			extend         : mod.SourceTest_02,
			module         : mod,
			singleton      : true,
			beforeinstance : function() {
				before_instance_02 = true;
			}
		} );

		expect( before_instance_01 ).to.be.true;
		expect( before_instance_02 ).to.be.true;

		done();
	} );

	test( 'initialising and applying instance configurations', function( done ) {
		var instance = new mod.SourceTest_02( { foo : 'bar', bar : 'bam', bam : 'boom' } );

		expect( instance.foo ).to.equal( 'bar' );
		expect( instance.bar ).to.equal( 'bam' );
		expect( instance.bam ).to.equal( 'boom' );

		done();
	} );
	test( 'mixins', function( done ) {
		var expected_options      = { delay : 250 },
			instance,
			observer_ctor_called  = false,
			observer_mixin_called = false;

		id8.define( 'MixinTest_01', {
			constructor  : function MixinTest_01() {
				this.parent( arguments );
				observer_ctor_called = true;
				this.mixin( 'observer', [this.observers] );
			},
			extend       : 'id8.Source',
			mixins       : 'id8.Observer',
			module       : mod,
			observe      : function( evt, fn, ctx, opt ) {
				observer_mixin_called = true;

				expect( evt ).to.equal( 'foo' );
				expect( fn ).to.equal( m8.noop );
				expect( ctx ).to.equal( m8.modes );
				expect( opt ).to.equal( expected_options );

				this.mixin( 'observer', arguments );

				expect( this.listeners.get( 'foo' ) ).to.be.an( 'array' );
				expect( this.listeners.get( 'foo' ).length ).to.equal( 1 );

				var cb = this.listeners.get( 'foo' )[0];

				expect( cb.fn ).to.equal( m8.noop );
				expect( cb.ctx ).to.equal( m8.modes );
				expect( cb.delay ).to.equal( 250 );
			}
		} );

		instance = id8( 'mixintest_01' );

		expect( observer_ctor_called ).to.be.true;

		instance.observe( 'foo', m8.noop, m8.modes, expected_options );

		expect( observer_mixin_called ).to.be.true;

		done();
	} );
	test( 'mixins with inheritance', function( done ) {
		var GenericMixin_01_foo_called = false,
			GenericMixin_02_bar_called = false,
			instance;

		id8.define( 'GenericMixin_01', {
			module : mod,
			foo    : function( foo ) {
				GenericMixin_01_foo_called = true;
				expect( foo ).to.equal( 'bar' );
				return foo;
			}
		} );

		mod.GenericMixin_02 = {
			bar : function( bar ) {
				GenericMixin_02_bar_called = true;
				expect( bar ).to.equal( 'foo' );
			}
		};

		id8.define( 'MixinTest_02', {
			extend  : mod.MixinTest_01,
			mixins  : {
				foo : 'genericmixin_01',
				bar : mod.GenericMixin_02
			},
			module  : mod,
			bar     : function() {
				return this.mixin( arguments );
			}
		} );

		instance = mod.MixinTest_02( {
			observers : {
				event1 : m8.exists,
				event2 : m8.empty
			}
		} );

		expect( instance.foo( 'bar' ) ).to.equal( 'bar' );
		expect( instance.bar( 'foo' ) ).to.equal( instance );

		expect( GenericMixin_01_foo_called ).to.be.true;
		expect( GenericMixin_02_bar_called ).to.be.true;

		expect( m8.type( instance.listeners ) ).to.equal( 'id8-hash' );
		expect( instance.listeners.length ).to.equal( 2 );
		expect( instance.listeners.keys ).to.deep.equal( ['event1', 'event2'] );

		done();
	} );
} );
