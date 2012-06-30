	util.x.cache( 'Function', function( Type ) {
		util.def( Type.prototype, 'callback', function( conf ) {
			return ( new __lib__.Callback( this, conf ) ).fire.mimic( this );
		}, 'w' );
	} );
