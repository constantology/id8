typeof id8  !== 'undefined' || ( id8  = require( '../id8' ) );
typeof chai !== 'undefined' || ( chai = require( 'chai' ) );

m8     = id8.m8;
expect = chai.expect;

suite( 'id8', function() {
	test( 'nomenclature', function() {
		expect( 'if you\'re reading this, it\'s already too late...' ).to.be.ok;
	} );
} );
