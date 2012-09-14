__lib__.define( namespace( 'Hash' ), function() {
	var ID = __guid__, cache = util.obj();

	return {
		constructor : function Hash( o ) {
			util.def( this, ID, util.guid(), 'r', true );

			cache[this[ID]] = util.obj();

			!is_obj( o ) || this.set( o );
		},
		extend      : Object,
		module      : __lib__,
// public properties
		keys        : { get : function() { return Object.keys( cache[this[ID]] ); } },
		length      : { get : function() { return this.keys.length; } },
		values      : { get : function() { return Object.values( cache[this[ID]] ); } },
// public methods
		aggregate   : function( val, fn, ctx ) {
			var H = this, o = cache[this[ID]]; ctx || ( ctx = H );
			return Object.keys( o ).reduce( function( res, k, i ) { return fn.call( ctx, res, o[k], k, H, i ); }, val );
		},
		clear       : function() {
			delete cache[this[ID]];
			cache[this[ID]] = util.obj();
		},
		clone       : function() { return new __lib__.Hash( this.valueOf() ); },
		destroy     : function() {
			delete cache[this[ID]];
		},
		each        : function( fn, ctx ) {
			var H = this, o = cache[H[ID]]; ctx || ( ctx = H );
			Object.keys( o ).forEach( function( k, i ) { fn.call( ctx, o[k], k, H, i ); }, H );
		},
		get         : function( k ) { return util.has( cache[this[ID]], k ) ? cache[this[ID]][k] : null; },
		has         : function( k ) { return util.has( cache[this[ID]], k ); },
		key         : function( v ) { return Object.key( cache[this[ID]], v ); },
		reduce      : function( fn, val ) {
			var H = this, o = cache[H[ID]];
			return Object.keys( o ).reduce( function( res, k, i ) { return fn.call( H, res, o[k], k, H, i ); }, val );
		},
		remove      : function( k ) { return util.has( cache[this[ID]], k ) ? ( delete cache[this[ID]][k] ) : false; },
		set         : function( o, v ) {
			switch ( util.nativeType( o ) ) {
				case 'object' : Object.keys( o ).forEach( function( k ) { this.set( k, o[k] ); }, this ); break;
				default       : cache[this[ID]][o] = v;
			}
		},
		stringify   : function() { return JSON.stringify( cache[this[ID]] ); },
		toString    : function() { return util.tostr( cache[this[ID]] ); },
		valueOf     : function() { return util.copy( util.obj(), cache[this[ID]] ); }
	};
}() );
