id8.Class( '^id8.Hash', function() {
	var ID = '__hashid__', cache = [];

	return {
		constructor : function Hash( o ) {
			m8.def( this, ID, m8.describe( cache.push( m8.obj() ) - 1, 'w' ) );
			m8.nativeType( o ) != 'object' || this.set( o );
		},
		module      : id8,

		keys        : { get : function() { return Object.keys( cache[this[ID]] ); } },
		length      : { get : function() { return this.keys.length; } },
		values      : { get : function() { return Object.values( cache[this[ID]] ); } },

		aggregate   : function( val, fn, ctx ) {
			var H = this, o = cache[this[ID]]; ctx || ( ctx = H );
			return Object.keys( o ).reduce( function( res, k, i ) { return fn.call( ctx, res, o[k], k, H, i ); }, val );
		},
		clear       : function() { cache[this[ID]] = m8.obj(); },
		clone       : function() { return new id8.Hash( this.valueOf() ); },
		each        : function( fn, ctx ) {
			var H = this, o = cache[H[ID]]; ctx || ( ctx = H );
			Object.keys( o ).forEach( function( k, i ) { fn.call( ctx, o[k], k, H, i ); }, H );
		},
		get         : function( k ) { return m8.has( cache[this[ID]], k ) ? cache[this[ID]][k] : null; },
		has         : function( k ) { return m8.has( cache[this[ID]], k ); },
		key         : function( v ) { return Object.key( cache[this[ID]], v ); },
		reduce      : function( fn, val ) {
			var H = this, o = cache[H[ID]];
			return Object.keys( o ).reduce( function( res, k, i ) { return fn.call( H, res, o[k], k, H, i ); }, val );
		},
		remove      : function( k ) { return m8.has( cache[this[ID]], k ) ? ( delete cache[this[ID]][k] ) : false; },
		set         : function( o, v ) {
			switch ( m8.nativeType( o ) ) {
				case 'object' : Object.keys( o ).forEach( function( k ) { this.set( k, o[k] ); }, this ); break;
				default       : cache[this[ID]][o] = v;
			}
		},
		stringify   : function() { return JSON.stringify( cache[this[ID]] ); },
		toString    : function() { return m8.tostr( cache[this[ID]] ); },
		valueOf     : function() { return m8.copy( m8.obj(), cache[this[ID]] ); }
	};
}() );
