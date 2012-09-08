
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
			if ( !util.has( defaults, k ) ) {
				o[k] = config[k];
				delete config[k];
			}
			return o;
		}, util.obj() );
	}

	function get( name_or_type ) {
		name_or_type = String( name_or_type );

		if ( name_or_type in registered_path )
			return registered_path[name_or_type];
		if ( name_or_type in registered_type )
			return registered_type[name_or_type];

		var path = name_or_type.replace( re_invalid_chars, '' ),
			type = name_or_type.toLowerCase();

		return registered_path[path]              || registered_type[type]
			|| registered_path[Name + '.' + path] || registered_type[Name_lc + '-' + type];
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

	var bid = 'bufferId', tid = 'timeoutId';

	return {
		constructor : function Callback( fn, conf ) {
			util.copy( this, conf || {} );

			var desc = util.describe( null, 'w' ),
				fire = ( util.type( this.buffer ) == 'number' ? buffer : this.exec ).bind( this );

			desc.value = fn;   util.def( this, 'fn',           desc );
			desc.value = this; util.def( fire, 'cb',           desc );
			desc.value = fire; util.def( this, 'fire',         desc );
							   util.def( this, 'handleEvent_', desc );

			this.args || ( this.args = [] );
			this.ctx  || ( this.ctx  = this );
			util.type( this.delay ) == 'number' || ( this.delay = null );
			util.type( this.times ) == 'number' && this.times > 0 || ( this.times = 0 );

			this.enable();
		},
		chain       : true,
		module      : __lib__,
// properties
		buffer      : null,
		count       : 0,
		delay       : null,
		times       : 0,
// methods
		disable     : function() {
			this.disabled    = true;
			this.handleEvent = util.noop;
		},
		enable      : function() {
			this.disabled    = false;
			this.handleEvent = this.handleEvent_;
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

__lib__.define( namespace( 'Observer' ), function() {
	function broadcast( args, cb ) {
		if ( !is_fun( cb.handleEvent ) ) return true;

		args = args.slice( 0 );

		if ( !!Object.key( this, cb.fn ) )                         // if the original callback function is a method on this Observer
			args[0] !== this || args.shift();                      // then if the first argument is the Observer remove it, as it's
		else if ( args[0] !== this )                               // an internal event listener. otherwise, if the Observer is not the
			args.unshift( this );                                  // first argument, then add it, so the callback has reference to
																   // which Observer fired the event
		return ( cb.handleEvent.apply( cb.ctx, args ) !== false ); // if a callback explicitly returns false, then we want to stop broadcasting
	}

	function createCallback( fn, config ) {
		return __lib__( 'callback', fn, config );
	}

	function createCallbackConfig( config, ctx ) {
		switch( util.nativeType( config ) ) {
			case 'boolean' : config = { times : !!config ? 1 : 0 };     break;
			case 'number'  : config = { delay :   config };             break;
			case 'object'  : config = util.merge( util.obj(), config ); break;
			default        : config = util.obj();
		}

		if ( util.got( config, 'single' ) ) {
			config.times = !!config.single ? 1 : 0;
			delete config.single;
		}

		if ( !Array.isArray( config.args ) )
			config.args = [];

		config.ctx = ctx;

		return config;
	}

	function createRelayCallback( ctxr, ctx, evt ) {
		return function Observer_relayedCallback() {
			var args = Array.coerce( arguments );
			!( args[0] === ctxr ) || args.shift(); // switch the context to the object relaying the event instead of the object that relayed it
			args.unshift( evt, ctx );
			return relay.apply( ctx, args );
		};
	}

	function findIndex( observer, queue, fn, ctx ) {
		var cb, i = -1; ctx || ( ctx = observer );

		while ( cb = queue[++i] ) {
			if ( cb === fn || ( cb.fn === fn && cb.ctx === ctx ) ) {
				return i;
			}
		}
		return null;
	}

	function getListener( listeners, queue, event ) {
		var firing_event = String( this ), match;

		if ( event === firing_event )
			listeners.push.apply( listeners, queue );
		else {
			match = firing_event.match( event );
			if ( Array.isArray( match ) && match[0] === firing_event )
				listeners.push.apply( listeners, queue );
		}

		return listeners;
	}
	function getListeners( observer, event ) {
		return observer.listeners.aggregate( [], getListener, event );
	}

	function handleEvent( cb ) {
		return function handleEvent() {
			return is_fun( cb.handleEvent ) ? cb.handleEvent.apply( cb, arguments ) : U;
		};
	}

	function observe( observer, listeners ) {
		listeners = util.copy( util.obj(), listeners );

		if ( !listeners.ctx )
			listeners.ctx = observer;

		if ( util.got( listeners, 'options' ) )
			listeners.options = createCallbackConfig( listeners.options );

		return Object.reduce( listeners, observe_type, observer );
	}

	function observe_multi( event, ctx, options ) {
		return function _observe( fn ) {
			this.observe( event, fn, ctx, options );
		};
	}

	function observe_type( observer, listener, event, listeners, index ) {
		if ( event == 'ctx' || event == 'options' )
			return observer;

		var ctx, fn, options, type= util.type( listener );

		switch ( type ) {
			case type_callback :
				fn  = listener;
				break;

			case 'function'    : case 'array'  : case 'string' :
				ctx = listeners.ctx;
				fn  = listener;
				break;

			case 'nullobject'  : case 'object' :
				ctx     = listener.ctx || listeners.ctx;
				fn      = listener.fn;
				options = util.got( listener, 'options' ) ? createCallbackConfig( listener.options ) : listeners.options;
				break;
		}

		observer.observe( event, fn, ctx, options );

		return observer;
	}

	function relay() { return this.broadcast.apply( this, arguments ); }

	function wildCardEsc( evt ) { return String( evt ).toLowerCase().replace( re_wc, '.*' ); }

	var re_wc = /\*/g, type_callback = Name + '-callback';

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

			var queue = getListeners( this, event ); // in any case will return a different array to the queue to ensure
													 // any listeners added or removed during broadcast don't affect the
													 // current broadcast

			if ( !queue.length ) return; 			 // if no event queue, then don't even bother

			this.broadcasting = event;

// if a callback returns false then we want to stop broadcasting, every will do this, forEach won't!
			queue.every( broadcast.bind( this, Array.coerce( arguments, 1 ) ) );

			this.broadcasting = false;
		},
		buffer         : function( ms, evt, fn, ctx, options ) {
			is_obj( options ) || ( options = util.obj() ); options.buffer = Number( ms );
			this.observe( evt, fn, ctx, options );
		},
		delay          : function( ms, evt, fn, ctx, options ) {
			is_obj( options ) || ( options = util.obj() ); options.delay = Number( ms );
			this.observe( evt, fn, ctx, options );
		},
		destroy        : function() {
			if ( this.destroyed ) return true;
			if ( this.broadcast( 'before:destroy' ) === false ) return false;
			this.destroying = true;
			this._destroy().onDestroy();
			this.destroying = false;
			this.destroyed  = true;
			this.broadcast( 'destroy' );
			this.observer_suspended = true;
			delete this.listeners;
			return true;
		},
		ignore         : function( event, fn, ctx ) {
			event = wildCardEsc( event.toLowerCase() );

			var queue = this.listeners.get( event ), i, o;

			if ( !Array.isArray( queue ) || !queue.length ) return;

			var index = findIndex( this, queue, fn, ctx );

			!~index || queue.splice( index, 1 );
		},
		observe        : function( event, fn, ctx, options ) {
			if ( is_obj( event ) )
				return observe( this, event );

			event = wildCardEsc( String( event ).toLowerCase() );

			var queue = this.listeners.get( event ),
				type  = util.type( fn );

			Array.isArray( queue ) || this.listeners.set( event, ( queue = [] ) );

			switch ( type ) {
				case type_callback :
					queue.push( fn );
					break;

				case 'array'       :
					fn.map( observe_multi( event, ctx, options ), this );
					break;

				default            : switch( type ) {
					case 'object'     :
					case 'nullobject' : if ( util.has( fn, 'handleEvent' ) ) {
						if ( is_obj( ctx ) && options === U )
							options = ctx;
						ctx = fn;
						fn  = handleEvent( fn );
					}      break;

					case 'string'     : if ( is_obj( ctx ) ) {
						fn = ctx[fn];
					}      break;
				}
				queue.push( createCallback( fn, createCallbackConfig( options, ctx || this ) ) );
			}
		},
		once           : function( evt, fn, ctx, options ) {
			is_obj( options ) || ( options = util.obj() );
			options.single = true;
			this.observe( evt, fn, ctx, options );
		},
		purgeObservers : function( event ) {
			event ? this.listeners.set( wildCardEsc( event ), [] ) : this.listeners.clear();
		},
		relayEvents    : function( target_observer ) {
			var e = Array.coerce( arguments, 1 ), evt;
			while ( evt = e.shift() )
				this.observe( evt, createRelayCallback( this, target_observer, evt ), target_observer );
		},
		resumeEvents   : function() {
			if ( !this.observer_suspended ) return;

			this.observer_suspended = false;
			this.broadcast( 'observer:resumed' );
		},
		suspendEvents  : function() {
			if ( this.observer_suspended ) return;

			this.broadcast( 'observer:suspended' );
			this.observer_suspended = true;
		},

// internal methods
		_destroy       : util.noop,
		onDestroy      : util.noop
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
	util.def( __lib__, 'util', util, 'w' ); // store a reference as util as well so we can avoid hard reference in other libs

	anon_list.Class_constructor     = true; // add these two method names to the anonymous function names list
	anon_list.Class_instance_method = true; // this will give us more clarity when debugging

// extend Function and Object natives with id8's extensions if not sandboxed
// or sandboxed environment's natives with all m8 AND id8 extensions
	util.x( Object, Array, Boolean, Function );

// at this point we don't know if m8 is available or not, and as such do not know what environment we are in.
// so, we check and do what is required.
}( ( typeof m8 != 'undefined' ? m8 : typeof require != 'undefined' ? require( 'm8' ) : null ), 'id8' );
