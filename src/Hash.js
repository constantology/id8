__lib__.define( namespace( 'Hash' ), function() {

	function get_ordered_item_full( id, k ) {
		var res = [], item = cache_ordered[id].find( function( item, j ) {
			if ( k === item[0] ) {
				res[0] = j;
				return true;
			}
		} );

		if ( item ) {
			res[1] = item;

			return res;
		}

		return null;
	}
	function get_ordered_item_index( id, k ) {
		var i = -1;

		cache_ordered[id].some( function( item, j ) {
			if ( k === item[0] ) {
				i = j;
				return true;
			}
		} );

		return i;
	}

	var ID = __guid__, cache = util.obj(), cache_okeyval = util.obj(), cache_ordered = util.obj();

	return {
		constructor : function Hash( o ) {
			util.def( this, ID, util.guid(), 'r', true );

			cache[this[ID]]         = util.obj();
			cache_ordered[this[ID]] = [];
			cache_okeyval[this[ID]] = [];

			!is_obj( o ) || this.set( o );
		},
		extend      : Object,
		module      : __lib__,
// public properties
		keys        : { get : function() { return Object.keys( cache[this[ID]] ); } },
		length      : { get : function() { return this.okeys.length; } },
		okeys       : { get : function() { return cache_okeyval[this[ID]][0] || ( cache_okeyval[this[ID]][0] = cache_ordered[this[ID]].pluck( '0' ) ); } },
		ovalues     : { get : function() { return cache_okeyval[this[ID]][1] || ( cache_okeyval[this[ID]][1] = cache_ordered[this[ID]].pluck( '1' ) ); } },
		values      : { get : function() { return Object.values( cache[this[ID]] ); } },
// public methods
		aggregate   : function( val, fn, ctx ) {
			var H = this, o = cache[this[ID]]; ctx || ( ctx = H );
			return Object.keys( o ).reduce( function( res, k, i ) { return fn.call( ctx, res, o[k], k, H, i ); }, val );
		},
		clear       : function() {
			delete cache[this[ID]];

			cache[this[ID]]                = util.obj();
			cache_ordered[this[ID]].length = 0;
			cache_okeyval[this[ID]].length = 0;
		},
		clone       : function() {
			var h = new __lib__.Hash();
			cache_ordered[this[ID]].forEach( function( item ) {
				this.set( item[0], item[1] );
			}, h );
			return h;
		},
		destroy     : function() {
			delete cache[this[ID]];
			delete cache_ordered[this[ID]];
			delete cache_okeyval[this[ID]];
		},
		each        : function( fn, ctx ) {
			var H = this, o = cache[H[ID]]; ctx || ( ctx = H );
			Object.keys( o ).forEach( function( k, i ) { fn.call( ctx, o[k], k, H, i ); }, H );
		},
		get         : function( k ) {
			var c = cache[this[ID]], k, v;

			if ( util.has( c, k ) )
				return c[k];

// this here is dedicated to shiternet explorer
			k = this.okeys;
			v = this.ovalues;

			return k.length
				 ? v[k.indexOf( k )] || null
				 : null;
		},
		has         : function( k ) { return util.has( cache[this[ID]], k ); },
		key         : function( v ) { return Object.key( cache[this[ID]], v ); },
		reduce      : function( fn, val ) {
			var H = this, o = cache[H[ID]];
			return Object.keys( o ).reduce( function( res, k, i ) { return fn.call( H, res, o[k], k, H, i ); }, val );
		},
		remove      : function( k ) {
			if ( util.has( cache[this[ID]], k ) ) {
				var i = get_ordered_item_index( this[ID], k );

				!~i || cache_ordered[this[ID]].splice( i, 1 );

				cache_okeyval[this[ID]].length = 0;

				return delete cache[this[ID]][k];
			}

			return false;
		},
		set         : function( o, v ) {
			var item;

			switch ( util.ntype( o ) ) {
				case 'object' : Object.keys( o ).forEach( function( k ) { this.set( k, o[k] ); }, this ); break;
				default       :
					cache[this[ID]][o] = v;

					if ( item = get_ordered_item_full( this[ID], o ) )
						item[1][1] = v;
					else
						cache_ordered[this[ID]].push( [o, v] );

					cache_okeyval[this[ID]].length = 0;
			}
		},
		stringify   : function() { return JSON.stringify( cache[this[ID]] ); },
		toString    : function() { return util.tostr( cache[this[ID]] ); },
		valueOf     : function() { return util.copy( util.obj(), cache[this[ID]] ); }
	};
}() );
