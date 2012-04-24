	function rm( k ) { delete this[k]; }

	var U, id8;

	m8.x.cache( 'Function', function( Type ) {
		m8.def( Type.prototype, 'callback', m8.describe( function( conf ) {
			return ( new id8.Callback( this, conf ) ).fire.mimic( this );
		}, 'w' ) );
	} );
	m8.x.cache( 'Object', function( Type ) {
		m8.defs( Type, {
			key    : function( o, v ) {
				for ( var k in o ) if ( m8.has( o, k ) && o[k] === v ) return k;
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
	m8.x( Object, Array, Boolean, Function );
