typeof m8     !== 'undefined' || ( m8     = require( 'm8' ) );
typeof id8    !== 'undefined' || ( id8    = require( 'id8' ) );
typeof expect !== 'undefined' || ( expect = require( 'expect.js' ) );

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
		return function( obs, success ) {
			var scope = this;

			expect( success ).to.be( true );
			expect( obs ).to.be( observer );
			expect( scope ).to.be( ctx );

			done();
		};
	}

	test( 'adding and removing observer callbacks', function( done ) {
		var cb = createExpectations( done );
		
		observer.observe( 'test:addobserver', cb, ctx );
		observer.broadcast( 'test:addobserver', true );
		observer.ignore( 'test:addobserver', cb, ctx ); // if the observer is not removed a multiple claim error will be thrown.
		observer.broadcast( 'test:addobserver', false );
	} );

	test( 'using id8.Callback with id8.Observer', function( done ) {
		var cb = id8.Callback( function( obs ) {
				var scope = this, args = Array.coerce( arguments, 1 );

				expect( disabled ).to.be( false );
				expect( removed ).to.be( false );
				expect( args ).to.eql( [1, 2, 3, 4, 5, 6] );
				expect( obs ).to.be( observer );
				expect( scope ).to.be( ctx );

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

	test( 'broadcasting observer callbacks added with a configuration Object', function( done ) {
		observer.broadcast( 'test:config:object', true, createExpectations( done ) );
	} );

	test( 'broadcasting observer callbacks added with an Array', function( done ) {
		observer.broadcast( 'test:config:array', true, createExpectations( done ) );
	} );

	test( 'broadcasting observer callbacks added with the default configuration', function( done ) {
		observer.broadcast( 'test:config:default', true, createExpectations( done ) );
	} );

	test( 'using wildcard events', function( done ) {
		var cb = createExpectations( done );

		observer.observe( 'foo*bar*', cb, ctx );
		observer.broadcast( 'foolishbarfly', true );

		observer.ignore( 'foo*bar*', cb, ctx );

		observer.broadcast( 'foolishbarfly', false );
		observer.broadcast( 'foo*bar*', false );
	} );

	test( 'delayed firing of an observer callback', function( done ) {
		function cb( obs, success ) {
			var scope = this, time = Date.now() - ms;

			expect( time ).to.be.within( 220, 280 );
			expect( success ).to.be( true );
			expect( obs ).to.be( observer );
			expect( scope ).to.be( ctx );

			observer.ignore( 'test:delayed', cb, ctx );

			done();
		}

		observer.delay( 250, 'test:delayed', cb, ctx );
		observer.broadcast( 'test:delayed', true );

		var ms = Date.now();
	} );

	test( 'buffering an observer callback', function( done ) {
		function cb( obs, success ) {
			expect( success ).to.be( true );
			expect( obs ).to.be( observer );
			expect( this ).to.be( ctx );
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

			expect( suspended ).to.be( false );
			expect( success ).to.be( true );
			expect( obs ).to.be( observer );
			expect( scope ).to.be( ctx );

			done();
		}, ctx );

		observer.suspendEvents()
				.broadcast( 'test:suspendresume', false );

		suspended = false;

		observer.resumeEvents()
				.broadcast( 'test:suspendresume', true );
	} );

	test( 'relaying observers', function( done ) {
		var observer2 = id8.Observer();

		observer.relayEvents( observer2, 'test:relay1', 'test:relay2' );

		function cb( obs, success ) {
			expect( success ).to.be( true );
			expect( obs ).to.be( observer2 );
			expect( this ).to.be( ctx );
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
		var o = id8.Observer( {
			event1 : { fn : [m8.noop, m8], ctx : this },
			event2 : { fn : m8.noop, ctx : this },
			event3 : m8.noop,
			event4 : m8,
			ctx    : this
		} );

		expect( o.listeners.get( 'event1' ).length ).to.eql( 2 );

		o.purgeObservers( 'event1' );

		expect( o.listeners.get( 'event1' ).length ).to.eql( 0 );
		expect( o.listeners.get( 'event4' ).length ).to.eql( 1 );

		o.purgeObservers( 'event4' );

		expect( o.listeners.get( 'event4' ).length ).to.eql( 0 );
		expect( o.listeners.length ).to.eql( 4 );

		o.purgeObservers();

		expect( o.listeners.length ).to.eql( 0 );

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
		
		expect( o.destroy() ).to.be( true );
		expect( o.listeners ).to.be( undefined );
		expect( o.destroyed ).to.be( true );

		done();
	} );
} );
