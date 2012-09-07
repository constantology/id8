typeof id8  !== 'undefined' || ( id8  = require( 'id8' ) );
typeof chai !== 'undefined' || ( chai = require( 'chai' ) );

m8     = id8.m8;
expect = chai.expect;

suite( 'id8.Observer', function() {
	function testCallback( obs, success, fn ) { fn.call( this, obs, success ); }

	var ctx      = { foo : 'bar' },
		observer = new id8.Observer( {
			'test:config:object'  : { fn : testCallback, ctx : ctx },
			'test:config:array'   : [testCallback],
			 ctx                  : ctx
		} );

	observer.observe( 'test:config:default', testCallback, ctx );

	function createExpectations( done ) {
		return function( observer, success ) {
			var scope = this;

			expect( success ).to.be.true;
			expect( observer ).to.equal( observer );
			expect( scope ).to.equal( ctx );

			m8.nativeType( done ) != 'function' || done();
		};
	}

	test( 'adding and removing observer callbacks', function( done ) {
		var cb = createExpectations( done );
		observer.observe( 'test:addobserver', cb, ctx );

		observer.broadcast( 'test:addobserver', true );

		expect( observer.listeners.length ).to.equal( 4 );
		expect( observer.listeners.get( 'test:addobserver' ) ).to.be.an( 'array' );
		expect( observer.listeners.get( 'test:addobserver' ).length ).to.equal( 1 );

		observer.ignore( 'test:addobserver', cb, ctx ); // if the observer is not removed a multiple claim error will be thrown.
		observer.broadcast( 'test:addobserver', false );
	} );

	test( 'broadcasting observer callbacks added with a configuration Object', function( done ) {
		observer.broadcast( 'test:config:object', true, createExpectations( done ) );
	} );

	test( 'broadcasting observer callbacks added with an Array', function( done ) {
		observer.broadcast( 'test:config:array', true, createExpectations( done ) );
	} );

	test( 'broadcasting observer callbacks added with the default configuration', function( done ) {
		observer.broadcast( 'test:config:default', true, createExpectations( done ) );
	} );

	test( 'using id8.Callback with id8.Observer', function( done ) {
		var cb = id8.Callback( function( obs ) {
				var scope = this, args = Array.coerce( arguments, 1 );

				expect( disabled ).to.be.false;
				expect( removed ).to.be.false;
				expect( args ).to.eql( [1, 2, 3, 4, 5, 6] );
				expect( obs ).to.equal( observer );
				expect( scope ).to.equal( ctx );

			}, { ctx : ctx, args : [1, 2, 3] } ),
			disabled = false,
			removed  = false;

		observer.observe( 'test:id8:callback', cb );
		observer.broadcast( 'test:id8:callback', 4, 5, 6 );

		cb.disable();
		disabled = true;

		observer.broadcast( 'test:id8:callback', 4, 5, 6 );

		cb.enable();
		disabled = false;

		observer.broadcast( 'test:id8:callback', 4, 5, 6 );

		observer.ignore( 'test:id8:callback', cb );
		removed = true;

		observer.broadcast( 'test:id8:callback', 4, 5, 6 );

		done();
	} );

	test( 'adding an id8.Callback to an id8.Observer using a configuration Object', function( done ) {
		function uncallback() {
			expect( 'this should not have been fired' ).not.to.be.ok;
		}
		var cb = id8.Callback( function( obs ) {
				var scope = this, args = Array.coerce( arguments, 1 );

				expect( disabled ).to.be.false;
				expect( removed ).to.be.false;
				expect( args ).to.eql( [1, 2, 3, 4, 5, 6] );
				expect( obs ).to.equal( observer );
				expect( scope ).to.equal( ctx );

			}, { ctx : ctx, args : [1, 2, 3] } ),
			disabled = false,
			removed  = false;

		observer.observe( {
			'test:non:id8:callback' : uncallback,
			'test:id8:callback'     : cb,
			 ctx                    : this
		} );
		observer.broadcast( 'test:id8:callback', 4, 5, 6 );

		cb.disable();
		disabled = true;

		observer.broadcast( 'test:id8:callback', 4, 5, 6 );

		cb.enable();
		disabled = false;

		observer.broadcast( 'test:id8:callback', 4, 5, 6 );

		observer.ignore( 'test:id8:callback', cb, this );
		observer.ignore( 'test:non:id8:callback', uncallback, this );
		removed = true;

		observer.broadcast( 'test:id8:callback', 4, 5, 6 );

		done();
	} );

	test( 'using wildcard events', function( done ) {
		var cb = createExpectations();

		observer.observe( 'foo*bar*', cb, ctx );
		observer.broadcast( 'foolishbarfly', true );

		observer.ignore( 'foo*bar*', cb, ctx );

		observer.broadcast( 'foolishbarfly', false );
		observer.broadcast( 'foo*bar*', false );

		done();
	} );

	test( 'delayed firing of an observer callback', function( done ) {
		function cb( obs, success ) {
			var scope = this, time = Date.now() - ms;
			expect( time ).to.be.within( 220, 280 );
			expect( success ).to.be.true;
			expect( obs ).to.equal( observer );
			expect( scope ).to.equal( ctx );

			observer.ignore( 'test:delayed', cb, ctx );

			done();
		}

		observer.delay( 250, 'test:delayed', cb, ctx );

		var ms = Date.now();

		observer.broadcast( 'test:delayed', true );
	} );

	test( 'buffering an observer callback', function( done ) {
		function cb( obs, success ) {
			expect( success ).to.be.true;
			expect( obs ).to.equal( observer );
			expect( this ).to.equal( ctx );
		}

		observer.buffer( 50, 'test:buffering', cb, ctx );
		observer.broadcast(  'test:buffering', true );
		observer.broadcast(  'test:buffering', false  );

		setTimeout( function() {
			observer.broadcast( 'test:buffering', true );

			done();

			observer.ignore( 'test:buffering', cb );
		}, 50 );
	} );

	test( 'firing an observer callback only once', function( done ) {
		observer.once( 'test:single', createExpectations( done ), ctx );
		observer.broadcast( 'test:single', true );
		observer.broadcast( 'test:single', false );
		observer.broadcast( 'test:single', false );
	} );

	test( 'suspending and resuming observers', function( done ) {
		var suspended = true;

		observer.once( 'test:suspendresume', function( obs, success ) {
			var scope = this;

			expect( suspended ).to.be.false;
			expect( success ).to.be.true;
			expect( obs ).to.equal( observer );
			expect( scope ).to.equal( ctx );

			done();
		}, ctx );

		observer.suspendEvents()
				.broadcast( 'test:suspendresume', false );

		expect( observer.observer_suspended ).to.be.true;

		suspended = false;

		observer.resumeEvents()
				.broadcast( 'test:suspendresume', true );

		expect( observer.observer_suspended ).to.be.false;
	} );

	test( 'relaying observers', function( done ) {
		var observer2 = id8.Observer();

		observer.relayEvents( observer2, 'test:relay1', 'test:relay2' );

		function cb( obs, success ) {
			expect( success ).to.be.true;
			expect( obs ).to.equal( observer2 );
			expect( this ).to.equal( ctx );
		}

		observer2.observe( {
			'test:relay1' : cb,
			'test:relay2' : cb,
			 ctx          : ctx
		} );

		observer.broadcast( 'test:relay1', true );
		observer.broadcast( 'test:relay2', true );

		done();
	} );

	test( 'purgeObservers', function( done ) {
		var observer = id8.Observer( {
			event1 : { fn : [m8.noop, m8], ctx : this },
			event2 : { fn :  m8.noop,      ctx : this },
			event3 : m8.noop,
			event4 : m8,
			ctx    : this
		} );

		expect( observer.listeners.get( 'event1' ).length ).to.eql( 2 );

		observer.purgeObservers( 'event1' );

		expect( observer.listeners.get( 'event1' ).length ).to.eql( 0 );
		expect( observer.listeners.get( 'event4' ).length ).to.eql( 1 );

		observer.purgeObservers( 'event4' );

		expect( observer.listeners.get( 'event4' ).length ).to.eql( 0 );
		expect( observer.listeners.length ).to.eql( 4 );

		observer.purgeObservers();

		expect( observer.listeners.length ).to.eql( 0 );

		done();
	} );

	test( 'destroy', function( done ) {
		var o = id8.Observer( {
			event1 : { fn : [m8.noop, m8], ctx : this },
			event2 : { fn : m8.noop, ctx : this },
			event3 : m8.noop,
			event4 : m8,
			ctx    : this
		} );
		
		expect( o.destroy() ).to.be.true;
		expect( o.listeners ).to.be.undefined;
		expect( o.destroyed ).to.be.true;

		done();
	} );
} );
