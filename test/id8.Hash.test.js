typeof id8  !== 'undefined' || ( id8  = require( '../id8' ) );
typeof chai !== 'undefined' || ( chai = require( 'chai' ) );

m8     = id8.m8;
expect = chai.expect;

suite( 'id8.Hash', function() {
	var items = [1, 2, 3],
		h     = id8.Hash( { foo : 'bar', items : items } );

	test( 'keys', function( done ) {
		expect( h.keys ).to.eql( ['foo', 'items'] );

		done();
	} );

	test( 'length', function( done ) {
		expect( h.length ).to.eql( 2 );

		done();
	} );

	test( 'values', function( done ) {
		expect( h.values ).to.eql( ['bar', [1, 2, 3]] );

		done();
	} );

	test( 'aggregate', function( done ) {
		var h = id8.Hash( { one : 1, two : 2, three : 3, four : 4, five : 5 } );

		expect( h.aggregate( 0, function( res, v, k, o ) {
			expect( v ).to.eql( o.get( k ) );
			return res += v;
		} ) ).to.eql( 15 );

		done();
	} );

	test( 'each', function( done ) {
		var h   = id8.Hash( { one : 1, two : 2, three : 3, four : 4, five : 5 } ),
			res = 0;

		h.each( function( v, k, o ) {
			expect( v ).to.eql( o.get( k ) );
			return res += v;
		} );

		expect( res ).to.eql( 15 );

		done();
	} );

	test( 'get', function( done ) {
		expect( h.get( 'foo' ) ).to.eql( 'bar' );
		expect( h.get( 'items' ) ).to.equal( items );

		done();
	} );

	test( 'has', function( done ) {
		expect( h.has( 'foo' ) ).to.be.true;
		expect( h.has( 'items' ) ).to.be.true;

		done();
	} );

	test( 'key', function( done ) {
		expect( h.key( 'bar' ) ).to.eql( 'foo' );
		expect( h.key( items ) ).to.eql( 'items' );

		done();
	} );

	test( 'reduce', function( done ) {
		var h = id8.Hash( { one : 1, two : 2, three : 3, four : 4, five : 5 } );

		expect( h.reduce( function( res, v, k, o ) {
			expect( v ).to.eql( o.get( k ) );
			return res += v;
		}, 0 ) ).to.eql( 15 );

		done();
	} );

	test( 'remove', function( done ) {
		var h = id8.Hash( { one : 1, two : 2, three : 3, four : 4, five : 5 } );

		expect( h.remove( 'two' ) ).to.be.true;
		expect( h.remove( 'four' ) ).to.be.true;
		expect( h.remove(  1 ) ).to.be.false;
		expect( h.remove( 'seven' ) ).to.be.false;
		expect( h.valueOf() ).to.eql( { one : 1, three : 3, five : 5 } );

		done();
	} );

	test( 'set', function( done ) {
		h.set( 'lorem', 'ipsum' );

		expect( h.get( 'lorem' ) ).to.eql( 'ipsum' );
		expect( h.has( 'lorem' ) ).to.be.true;
		expect( h.key( 'ipsum' ) ).to.eql( 'lorem' );

		done();
	} );

	test( 'stringify', function( done ) {
		expect( h.stringify() ).to.eql( '{"foo":"bar","items":[1,2,3],"lorem":"ipsum"}' );

		done();
	} );

	test( 'clear', function( done ) {
		var h = id8.Hash( { one : 1, two : 2, three : 3, four : 4, five : 5 } );

		expect( h.length ).to.eql( 5 );
		h.clear();
		expect( h.length ).to.eql( 0 );
		expect( h.valueOf() ).to.eql( {} );

		done();
	} );
} );
