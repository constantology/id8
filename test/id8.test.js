typeof m8     !== 'undefined' || ( m8     = require( 'm8' ) );
typeof id8    !== 'undefined' || ( id8    = require( 'id8' ) );
typeof expect !== 'undefined' || ( expect = require( 'expect.js' ) );

suite( 'id8', function() {
	test( 'nomenclature', function() {
		expect( 'if you\'re reading this, it\'s already too late...' ).to.be.ok();
	} );
} );
