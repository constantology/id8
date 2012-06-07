
util.x.cache( 'Function', function( Type ) {
	util.def( Type.prototype, 'callback', util.describe( function( conf ) {
		return ( new __lib__.Callback( this, conf ) ).fire.mimic( this );
	}, 'w' ) );
} );
util.x.cache( 'Object', function( Type ) {
	function rm( k ) { delete this[k]; }

	util.defs( Type, {
		key    : function( o, v ) {
			for ( var k in o ) if ( util.has( o, k ) && o[k] === v ) return k;
			return null;
		},
		remove : function( o, keys ) {
			( Array.isArray( keys ) ? keys : Array.coerce( arguments, 1 ) ).forEach( rm, o );
			return o;
		}
	}, 'w' );
} );

// extend Function and Object natives with id8's extensions if not sandboxed
// or sandboxed environment's natives with all m8 AND id8 extensions
	util.x( Object, Array, Boolean, Function );
