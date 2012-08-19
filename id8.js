
;!function( util, Name, PACKAGE  ) {
	"use strict";

	function __lib__( name_or_type ) {
		var Class = is_fun( name_or_type ) && util.type( name_or_type ) == 'class'
				  ? name_or_type
				  : get( name_or_type );

		if ( !Class )
			throw new Error( Name + ' factory: No Class found with a name or type of ' + name_or_type );

		return Class.create.apply( null, Array.coerce( arguments, 1 ) );
	}

	function extract_default_properties( config, defaults ) {
		return Object.keys( config ).reduce( function( o, k ) {
			if ( !util.got( defaults, k ) ) {
				o[k] = config[k];
				delete config[k];
			}
			return o;
		}, util.obj() );
	}

	function get( name_or_type ) {
		return registered_path[name_or_type]              || registered_type[name_or_type]
			|| registered_path[Name + '.' + name_or_type] || registered_type[Name_lc + '-' + name_or_type];
	}

	function is( instance, Class ) {
		switch ( typeof Class ) {
			case 'function' : return instance instanceof Class;
			case 'string'   : return ( Class = get( Class ) ) ? ( instance instanceof Class ) : false;
		}
		return false;
	}

	function is_fun( item ) { return typeof item == 'function'; }
	function is_obj( item ) { return util.nativeType( item ) == 'object'; }
	function is_str( item ) { return typeof item == 'string'; }

	function namespace( name ) { return '^' + Name + '.' + name; }

	function register( Class ) {
		var name = Class[__classname__], type = Class.prototype[__type__];

		if ( name in anon_list )
			throw new Error( Name + '.register: Unable to register Class without ' + __classname__ + ' property.' );

		type || util.def( Class.prototype, __type__, ( type = name.toLowerCase().split( '.' ).join( '-' ) ), 'r', true );

		if ( name in registered_path || type in registered_type )
			throw new Error( Name + '.register: Unable to register Class. A Class called: ' + name + ', with type: ' + type + ' already exists.' );

		return ( registered_path[name] = registered_type[type] = Class );
	}

	function to_obj( o, k ) {
		o[k] = true;
		return o;
	}

	function type( instance ) {
		var Class = instance.constructor,
			type  = Class[__classname__] || Class[__name__];
		return type in anon_list ? 'Anonymous' : type;
	}

	var __classname__    = '__classname__',
		__name__         = '__name__',
		__singleton__    = '__singleton__',
		__super__        = '__super__',
		__type__         = '__type__',
		Name_lc          = Name.toLowerCase(), U,
		anon_list        = Function.anon_list,
		process          = util.obj(),
		re_invalid_chars = /[^A-Za-z0-9_\.]/g,
		registered_path  = util.obj(),
		registered_type  = util.obj();

util.def( __lib__, 'define', function() {
// public methods
	function define( class_path, descriptor ) {
		var Package, Class, ClassName,
			class_config = extract_default_properties( descriptor, default_prop_names ),
			class_name;

		if ( is_obj( class_path ) ) {
			descriptor = class_path;
			class_path = descriptor.classname || '';
			delete descriptor.classname;
		}

		class_name = class_path.replace( re_invalid_chars, '' );
		class_path = class_path.split( '.' );
		class_config.type || ( class_config.type = class_name.toLowerCase().split( '.' ).join( '-' ) );

		Class      = __lib__.Class( class_config );
		ClassName  = class_path.pop();
		Package    = util.bless( class_path, descriptor.module );

		decorate( class_config.singleton ? Class.constructor : Class, class_name );

		return Package[ClassName] = Class;
	}

	function decorate( Class, class_name ) {
		!class_name || util.def( Class, __classname__, class_name, 'cw', true );
		return register( Class );
	}

	var default_prop_names = 'after before mixins module'.split( ' ' ).reduce( to_obj, util.obj() );

	return define;
}(), 'w' );

util.def( __lib__, 'Class', function() {
// public methods
	function Class( config ) {
		var Constructor = make_class( config = make_config( config ) );

		return config.singleton
			 ? make_singleton( Constructor, config.singleton )
			 : Constructor;
	}

// Class static methods
	function create() { return singleton( this ) || this.apply( Object.create( this.prototype ), arguments ); }

	function singleton( Constructor ) { return !Constructor ? null : Constructor[__singleton__] || null; }

// Class instance method helpers
	function get_args( args ) { return util.tostr( args[0] ) === '[object Arguments]' ? args[0] : args; }

	function get_method_descriptor( o, k ) {
		var desc = Object.getOwnPropertyDescriptor( o, k )
				|| ( is_fun( o[k] )
				   ? util.describe( o[k], 'cw' )
				   : desc_default_super );
		desc.writable = true;
		return desc;
	}

	function get_return_value( ctx, value, chain ) { return chain && value === U ? ctx : value; }

	function set_super_method( ctx, desc_super ) {
		util.def( ctx, 'parent', desc_super, true );
		return ctx;
	}

// Class construction methods
	function add( key, value ) {
		var desc;
		switch ( util.nativeType( value ) ) {
			case 'object'   : desc = value; break;
			case 'function' : desc = util.describe( make_method( value, get_method_descriptor( this, key ), key ), 'cw' ); break;
			default         : desc = util.describe( value, 'ew' );
		}
		util.def( this, key, desc, true );
		return this.constructor;
	}

	function decorate( Constructor ) {
		util.def( Constructor, __type__, desc_class_type, true );
		util.defs( Constructor, {
			add    : add.bind( Constructor.prototype ),
			create : create.bind( Constructor )
		}, 'r', true );
		return Constructor;
	}

	function make_class( config ) {
		function Class_constructor() {
			return is( this, Class_constructor )
				 ? singleton( this.constructor )
				|| get_return_value( this, Constructor.call( this, arguments ), true )
				 : create.apply( Class_constructor, arguments );
		}

		var ctor        = config.constructor,
			super_class = config.extend,
			desc_chain  = config.chain === false || super_class.prototype[__chain__] === false
						? desc_false
						: desc_true,
			desc_super  = get_method_descriptor( super_class.prototype, 'constructor' ),
			name        = ctor[__name__],
			prototype   = Class_constructor.prototype = make_prototype( config ),
			Constructor = make_method( ctor, desc_super );

		prototype.constructor = Class_constructor;
		prototype.parent      = desc_default_super.value;

		util.def( Class_constructor, __super__, desc_super, true )
			.def( prototype,         __chain__, desc_chain, true );

// this is over-written by id8.define, unless the Class was not created using id8.define
// this will allow us to try and keep things as nice as possible.
		   util.got( anon_list, name )
		|| util.def( Class_constructor, __classname__, name, 'cw' )
			   .def( Class_constructor, 'displayName', name, 'cw' );

		return decorate( Class_constructor.mimic( ctor ) );
	}

	function make_config( descriptor ) {
		var class_config = util.merge( util.obj(), descriptor ),
			ctor         = class_config.constructor, name,
			super_class  = class_config.extend;

// if extending then make sure we have a Class to extend from, or else extend Object
		!is_str( super_class ) || ( super_class = get( super_class ) );
		 is_fun( super_class ) || ( super_class = Object );

// make sure we have a constructor and if using the "extend", not Class_constructor
		( is_fun( ctor ) && ctor !== Object ) || ( ctor = super_class.valueOf() );

// set a type for this Class' instances if one is not defined
		is_str( class_config.type )
		|| ctor === Object
		|| util.got( anon_list, ( name = String( ctor[__name__] ) ) )
		|| ( class_config.type = name.toLowerCase() );

		class_config.constructor = ctor;
		class_config.extend      = super_class;

		return class_config;
	}

	function make_method( method, desc_super, name ) {
		desc_super = !is_obj( desc_super ) || method.valueOf() === desc_super.value.valueOf()
				   ? desc_default_super
				   : desc_super            || desc_default_super;

		return function Class_instance_method() {
			var desc = get_method_descriptor( this, 'parent' );
			return get_return_value( set_super_method( this, desc_super ),
									 method.apply( this, get_args( arguments ) ),
									 set_super_method( this, desc )[__chain__] !== false );
		}.mimic( method, name );
	}

	function make_prototype( class_config ) {
		var desc        = extract_default_properties( class_config, default_prop_names ),
			super_class = class_config.extend,
			processed   = util.obj(),
			prototype   = Object.reduce( desc, function( proto, value, key ) {
				processed[key] = true;
				add.call( proto, key, value );
				return proto;
			}, Object.create( super_class.prototype ) );

// this allows you to call "this.parent();" on a Class that has no Super Class, without throwing any errors...
		Object.getOwnPropertyNames( prototype ).forEach( function( key ) {
// skip non-methods and already processed properties
			key in processed || !is_fun( this[key] ) || add.call( this, key, util.describe( make_method( this[key], desc_default_super ), 'cw' ) );
		}, prototype );

		util.def(  prototype, __type__, class_config.type, 'w', true );
		util.defs( prototype, {
			mixins : { value : util.obj() },
			parent : desc_default_super
		}, 'w', true );

		return prototype;
	}

	function make_singleton( Constructor, singleton_config ) {
		var instance = Constructor.create.apply( null, singleton_config === true ? [] : [].concat( singleton_config ) );

		util.def( Constructor, __singleton__, util.describe( { value : instance }, 'r' ) );

		return instance;
	}

	var __chain__          = '__chain__',
		default_prop_names = 'chain constructor extend singleton type'.split( ' ' ).reduce( to_obj, util.obj() ),
		desc_class_type    =  util.describe( 'class', 'r' ),
		desc_default_super =  util.describe( make_method( util.noop, util.describe( util.noop, 'cw' ), 'parent' ), 'cw' ),
		desc_false         =  util.describe( false,   'w' ),
		desc_true          =  util.describe( true,    'w' );//,
//		empty_batch        = { after : [], before : [] };

	return Class;
}(), 'w' );

__lib__.define( namespace( 'Callback' ), function() {
	function buffer() {
		if ( bid in this ) return this;
		this[bid] = setTimeout( buffer_stop.bind( this ), this.buffer );
		return this.exec.apply( this, arguments );
	}
	function buffer_stop() { clearTimeout( this[bid] ); delete this[bid]; }
	function eventType( t ) { return t.indexOf( 'event' ) + 5 === t.length; }
	function handleEvent() { return this.fire.apply( this, arguments ); }

	var bid = 'bufferId', tid = 'timeoutId';

	return {
		constructor : function Callback( fn, conf ) {
			util.copy( this, conf || {} );

			var desc = util.describe( null, 'w' ),
				fire = ( util.type( this.buffer ) == 'number' ? buffer : this.exec ).bind( this );

			desc.value = fn;   util.def( this, 'fn',   desc );
			desc.value = this; util.def( fire, 'cb',   desc );
			desc.value = fire; util.def( this, 'fire', desc );

			this.args || ( this.args = [] );
			this.ctx  || ( this.ctx  = this );
			util.type( this.delay ) == 'number' || ( this.delay = null );
			util.type( this.times ) == 'number' && this.times > 0 || ( this.times = 0 );

			this.enable();
		},
		chain       : true,
		module      : __lib__,
// properties
		buffer      : null, count : 0,
		delay       : null, times : 0,
// methods
		disable     : function() {
			this.disabled    = true;
			this.handleEvent = util.noop;
		},
		enable      : function() {
			this.disabled    = false;
			this.handleEvent = handleEvent;
		},
		exec        : function() {
			if ( this.disabled ) return;
			this.times === 0 || this.times > ++this.count || this.disable();

			var a  = Array.coerce( arguments ), me = this, ctx = me.ctx,
				ms = me.delay, t = util.type( a[0] ), v;

			( t && ( eventType( t ) || t == Name + '-observer' ) )
			? a.splice.apply( a, [1, 0].concat( me.args ) )
			: a.unshift.apply( a, me.args );

			( ms === null
			? v = me.fn.apply( ctx, a )
			: me[tid] = setTimeout( function() { me.fn.apply( ctx, a ); }, ms ) );

			return v;
		},
		reset       : function() {
			this.count = 0;
			buffer_stop.call( this.enable() );
		},
		stop        : function() { !( tid in this ) || clearTimeout( this[tid] ), delete this[tid]; }
	};
}() );

__lib__.define( namespace( 'Hash' ), function() {
	var ID = '__hashid__', cache = [];

	return {
		constructor : function Hash( o ) {
			util.def( this, ID, util.describe( cache.push( util.obj() ) - 1, 'w' ) );
			!is_obj( o ) || this.set( o );
		},
		module      : __lib__,

		keys        : { get : function() { return Object.keys( cache[this[ID]] ); } },
		length      : { get : function() { return this.keys.length; } },
		values      : { get : function() { return Object.values( cache[this[ID]] ); } },

		aggregate   : function( val, fn, ctx ) {
			var H = this, o = cache[this[ID]]; ctx || ( ctx = H );
			return Object.keys( o ).reduce( function( res, k, i ) { return fn.call( ctx, res, o[k], k, H, i ); }, val );
		},
		clear       : function() { cache[this[ID]] = util.obj(); },
		clone       : function() { return new __lib__.Hash( this.valueOf() ); },
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

__lib__.define( namespace( 'Observer' ), function() {
	function addObservers( observers ) {
		observers = util.copy( util.obj(), observers );
		var ctx = observers.ctx, k, l, o, opt = observers.options, s;
		util.remove( observers, 'ctx', 'options' );

		for ( k in observers ) {
			l = observers[k];
			o = l.options === U ? l.options : opt;
			s = l.ctx     === U ? l.ctx     : ctx;

			switch ( util.nativeType( l ) ) {
				case 'function' : this.observe( k, l, ctx, opt );                                              break;
				case 'object'   : switch( util.nativeType( l.fn ) ) {
					case 'function' : case 'object' : this.observe( k, l.fn, s, o );                         break;
					case 'array'    : l.fn.forEach( function( fn ) { this.observe( k, fn, s, o ); }, this ); break;
				} break;
				case 'array'    : l.forEach( function( fn ) { this.observe( k, fn, ctx, opt ); }, this );      break;
			}
		}
		return this;
	}

	function broadcast( cb ) {
		var args = this.args.concat( cb.options.args ),
			ctx  = cb.ctx || this.ctx,
			fire = cb.fire  || cb.fn;

		if ( !is_fun( fire ) ) return true;

		if ( !!Object.key( this.ctx, cb.fn ) )        // if the original callback function is a method on this Observer
			args[0] !== this.ctx || args.shift();     // then if the first argument is the Observer util.remove it, as it's
		else if ( args[0] !== this.ctx )              // an internal event listener. otherwise, if the Observer is not the
			args.unshift( this.ctx );                 // first argument, then add it, so the callback knows what Observer fired it

		return ( fire.apply( ctx, args ) !== false ); // if a callback explicitly returns false, then we want to stop broadcasting
	}

	function createRelayCallback( ctxr, ctx, evt ) {
		return function Observer_relayedCallback() {
			var args = Array.coerce( arguments );
			!( args[0] === ctxr ) || args.shift(); // switch the context to the object relaying the event instead of the object that relayed it
			args.unshift( evt, ctx );
			return relay.apply( ctx, args );
		};
	}

// the reason we do this instead of passing { times : 1 } to Function.prototype.callback, is that we want to remove
// the callback from the observers queue after being fired once, rather than keeping it in the queue.
	function createSingleCallback( event, cb ) {
		var ctx = this;
		return ( cb.fire = function Observer_singleCallback() {
			ctx.ignore( event, cb.fn, cb.ctx );
			if ( cb.fired ) return;
			cb.fired = true;
			return cb.fn.apply( cb.ctx || ctx, arguments );
		} );
	}

	function find( e, o ) {
		var i = -1, l = e.length;
		while ( ++i < l ) if ( matchCallback( o, e[i] ) ) return e[i];
		return null;
	}


	function getObserver( r, v, k ) {
		var m;
		return ( k === this || ( Array.isArray( m = this.match( k ) ) && m[0] === this ) ) ? r.concat( v ) : r;
	}
	function getObservers( o, e )   { return o.listeners.aggregate( [], getObserver, e ); }

	function handleEvent( cb ) {
		return function handleEvent() { return cb.handleEvent.apply( cb, arguments ); }.mimic( cb.fire );
	}

	function matchCallback( o, cb ) {
		return ( o.isCB === true ? cb.fn.valueOf() === o.ctx.fire : cb.fn === o.fn ) && cb.ctx === o.ctx && cb.event === o.event;
	}

	function relay() { return this.broadcast.apply( this, arguments ); }

	function wildCardEsc( e ) { return e.replace( re_wc, '.*' ); }

	var listener_id = 0, re_wc = /\*/g;

	return {
		constructor    : function Observer( observers ) {
			this.broadcasting       = false; this.destroyed = false;
			this.observer_suspended = false; this.listeners = __lib__( 'Hash' );

			!is_obj( observers )      || this.observe( observers );
			!is_obj( this.observers ) || this.observe( this.observers ), delete this.observers;
		},
		module         : __lib__,

// public methods
		broadcast      : function( event ) {
			if ( this.destroyed || this.observer_suspended || !this.listeners.length || !event ) return;

			var args = Array.coerce( arguments, 1 ),
				e    = getObservers( this, event ); // this.listeners.get( event ).slice(); // slice: so we can add/ remove observers while this event is firing without disrupting the queue;

			if ( !e.length ) return; // if no event listeners, then don't worry

			this.broadcasting = event;

// if a callback returns false then we want to stop broadcasting, every will do this, forEach won't!
			e.every( broadcast, { args : args, ctx : this } );

			this.broadcasting = false;
		},
		buffer         : function( ms, evt, fn, ctx, o ) {
			is_obj( o ) || ( o = util.obj() ); o.buffer = Number( ms );
			this.observe( evt, fn, ctx, o );
		},
		delay          : function( ms, evt, fn, ctx, o ) {
			is_obj( o ) || ( o = util.obj() ); o.delay = Number( ms );
			this.observe( evt, fn, ctx, o );
		},
		destroy        : function() {
			if ( this.destroyed ) return true;
			if ( this.broadcast( 'before:destroy' ) === false ) return false;
			this.destroyed = true;
			this._destroy();
			this.broadcast( 'destroy' );
			this.observer_suspended = true;
			delete this.listeners;
			return true;
		},
		ignore         : function( event, fn, ctx ) {
			event = wildCardEsc( event.toLowerCase() );
			var e = this.listeners.get( event ), i, o;

			if ( !e ) return;

			switch ( util.type( fn ) ) {
				case ( Name + '-callback' ) : o = { ctx : fn,          isCB : true }; break;
				default                     : o = { ctx : ctx || this, fn   : fn   };
			}
			o.event = event;
			o = find( e, o );
			if ( o !== null ) {
				i = e.indexOf( o );
				i < 0 || e.splice( i, 1 );
			}
		},
		observe        : function( event, fn, ctx, o ) {
			var cb, e = this.listeners, fnt, q;

			if ( is_obj( event ) ) return addObservers.call( this, event );
			switch ( ( fnt = util.type( fn ) ) ) {
				case  'array' :
					cb = util.obj(); cb[event] = { fn : fn, options : o, ctx : ctx };
					return addObservers.call( this, cb );
				case  'object' : case 'nullobject' : case ( Name + '-callback' ) : if ( 'handleEvent' in fn ) {
					!( is_obj( ctx ) && o === U ) || ( o = ctx );
					ctx = fn; fn = handleEvent( fn );
				} break;
				case 'string'  : !ctx || ( fn = ctx[fn] ); break;
			}

			event = wildCardEsc( event.toLowerCase() );
			( q = e.get( event ) ) || e.set( event, ( q = [] ) );

			switch( util.nativeType( o ) ) {
				case 'boolean' : o = { single : !!o };       break;
				case 'number'  : o = { delay  :   o };       break;
				case 'object'  : o = util.copy( util.obj(), o ); break;
				default        : o = util.obj();
			}

			Array.isArray( o.args ) || ( o.args = [] );

			cb      = { ctx : ctx || this, event : event, fn : fn, id : ++listener_id, options : o };
			cb.fire = ( o.single ? createSingleCallback.call( this, event, cb ) : cb.fn ).callback( {
				args : o.args, buffer : o.buffer, ctx : cb.ctx, delay : o.delay
			} );
			q.push( cb );
		},
		once           : function( evt, fn, ctx, o ) {
			is_obj( o ) || ( o = util.obj() );
			o.single = true;
			this.observe( evt, fn, ctx, o );
		},
		purgeObservers : function( event ) {
			var e = this.listeners;
			if ( !event ) { e.clear(); return; }
			event = event.toLowerCase();
			!e.has( event ) || e.set( event, [] );
		},
		relayEvents    : function( o ) {
			var e = Array.coerce( arguments, 1 ), evt;
			while ( evt = e.shift() )
				this.observe( evt, createRelayCallback( this, o, evt ), o );
		},
		resumeEvents   : function() { !this.observer_suspended || ( this.observer_suspended = false, this.broadcast( 'observer:resumed'   ) ); },
		suspendEvents  : function() {  this.observer_suspended || ( this.observer_suspended = true,  this.broadcast( 'observer:suspended' ) ); },

// internal methods
		_destroy       : util.noop
	};
}() );

	util.x.cache( 'Function', function( Type ) {
		util.def( Type.prototype, 'callback', function( conf ) {
			return ( new __lib__.Callback( this, conf ) ).fire.mimic( this );
		}, 'w' );
	} );

	util.iter( PACKAGE ) || ( PACKAGE = util.ENV == 'commonjs' ? module : util.global );

	util.defs( ( __lib__ = util.expose( __lib__, Name, PACKAGE ) ), {
		get      : get,  is       : is,
		type     : type, register : register
	}, 'w', true );

	util.expose( util, __lib__ );           // store a reference to m8 on id8

	anon_list.Class_constructor     = true; // add these two method names to the anonymous function names list
	anon_list.Class_instance_method = true; // this will give us more clarity when debugging

// extend Function and Object natives with id8's extensions if not sandboxed
// or sandboxed environment's natives with all m8 AND id8 extensions
	util.x( Object, Array, Boolean, Function );

// at this point we don't know if m8 is available or not, and as such do not know what environment we are in.
// so, we check and do what is required.
}( ( typeof m8 != 'undefined' ? m8 : typeof require != 'undefined' ? require( 'm8' ) : null ), 'id8' );
