;!function( util, Name, PACKAGE  ) {
//	"use strict"; // removed because debugging in safari web inspector is impossible in strict mode!!!



/*~  src/lib.js  ~*/

	function __lib__( name_or_type ) {
		var Class = typeof name_or_type == 'function' && util.type( name_or_type ) == 'class'
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
		switch ( util.ntype( name_or_type ) ) {
			case 'function' :
			case 'object'   : return name_or_type;
			case 'string'   :
				if ( name_or_type in registered_path )
					return registered_path[name_or_type];
				if ( name_or_type in registered_type )
					return registered_type[name_or_type];
				if ( name_or_type in registered_alias )
					return registered_alias[name_or_type];

				var path = name_or_type.replace( re_invalid_chars, '' ),
					type = name_or_type.toLowerCase();

				return registered_path[path]              || registered_type[type]
					|| registered_path[Name + '.' + path] || registered_type[Name_lc + '-' + type];
		}

		return null;
	}

//	function get_return_value( ctx, value ) { return ctx[__chain__] === true && value === UNDEF ? ctx : value; }

	function is( instance, Class ) {
		switch ( typeof Class ) {
			case 'function' : return instance instanceof Class;
			case 'string'   : return ( Class = get( Class ) ) ? ( instance instanceof Class ) : false;
		}
		return false;
	}

	function is_obj( item ) { return util.ntype( item ) == 'object'; }

// this has moved from withing the `__lib__.Class` closure to use in `__lib__.define` coz of weird chrome b0rk crap!!!
	function make_singleton( Constructor, singleton_config ) {
		process_after( Constructor );

		var instance = Constructor.create.apply( null, singleton_config === true ? [] : [].concat( singleton_config ) );

		util.def( Constructor, __singleton__, util.describe( { value : instance }, 'r' ) );

		return instance;
	}

	function namespace( name ) { return '^' + Name + '.' + name; }

	function process_after( Class ) {
		if ( Class.__processed__ === true ) return Class;

		var after = ( internals[Class[__guid__]] || internals.empty ).after;

		if ( Array.isArray( after ) && after.length ) {
			after.invoke( 'call', null, Class );
			util.def( Class, '__processed__', true, 'r' );
		}

		return Class;
	}

	function process_before( ctx, args ) {
		var before = ( internals[ctx.constructor[__guid__]] || internals.empty ).before;

		!Array.isArray( before ) || before.invoke( 'call', null, ctx.constructor, ctx, args );

		return ctx;
	}

	function register( Class ) {
		var name = Class[__classname__], type = Class.prototype[__type__];

		if ( name in anon_list )
			throw new Error( Name + '.register: Unable to register Class without ' + __classname__ + ' property.' );

		type || util.def( Class.prototype, __type__, ( type = name.toLowerCase().split( '.' ).join( '-' ) ), 'c', true );

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



/*~  src/vars.js  ~*/

	var __chain__        = '__chain__',
		__classname__    = '__classname__',
		__config__       = '__config__',
		__guid__         = '__guid8__',
		__method__       = '__method__',
		__mixins__       = '__mixins__',
		__name__         = '__name__',
		__override__     = '__override__',
		__processing__   = '__processing__',
		__proto__        = '__proto__',
		__singleton__    = '__singleton__',
		__super__        = '__super__',
		__type__         = '__type__',
		UNDEF, Name_lc   = Name.toLowerCase(), OP = Object.prototype,
		anon_list        = Function.anon_list || util.obj(),
		internals        = util.obj(),
		re_invalid_chars = /[^A-Za-z0-9_\.$<>\[\]\{\}]/g,
		registered_alias = util.obj(),
		registered_path  = util.obj(),
		registered_type  = util.obj(),
		reserved_props   = [__chain__, __config__, __method__, __override__, __proto__, __type__, 'mixin', 'original', 'parent'].reduce( to_obj, util.obj() );

	internals.empty = { after : null, before : null, mixins : null };





/*~  src/lib.define.js  ~*/

util.def( __lib__, 'define', function() {
// public methods
	function define( class_path, descriptor ) {
		var Package, Class, ClassName, Constructor,
			class_config = extract_default_properties( descriptor, default_prop_names ),
			class_name, type_name;

		if ( is_obj( class_path ) ) {
			descriptor = class_path;
			class_path = descriptor.classname || '';
			delete descriptor.classname;
		}

		class_name  = class_path.replace( re_invalid_chars, '' );
		type_name   = class_name.toLowerCase().split( '.' ).join( '-' );
		class_path  = class_path.split( '.' );

		ClassName   = class_path.pop();
		Package     = util.bless( class_path, descriptor.module );

		if ( !class_config.extend )
			class_config.extend = get( 'Source' ) || Object;

		Class       = Package[ClassName] = __lib__.Class( class_config );

		if ( !class_config.singleton )
			Constructor = Class;
		else { // weird shizzle in chrome is making me have to do shizzle like thizzle!!!
			if ( typeof Class == 'function' )
				Class = make_singleton( Class, class_config.singleton );

			Constructor = Class.constructor;
		}

		util.def( Constructor.prototype, __type__, type_name, 'c', true );
		decorate( Constructor, class_name, descriptor.noreg === true );

		  !descriptor.alias
		|| descriptor.alias.split( ' ' ).map( function( alias ) {
			registered_alias[alias] = this;
		}, Constructor );

		class_config.singleton || process_after( Constructor );

		if ( typeof descriptor.path == 'string' && util.AMD )
			util.define( descriptor.path, Class );

		return Class;
//		return class_config.singleton && typeof Class == 'function' ? Class() : Class;
	}

	function decorate( Class, class_name, no_register ) {
		!class_name || util.def( Class, __classname__, class_name, 'cw', true );
		return no_register ? Class : register( Class );
	}

	var default_prop_names = 'alias module noreg path'.split( ' ' ).reduce( to_obj, util.obj() );

	return define;
}(), 'w' );



/*~  src/Class.js  ~*/

util.def( __lib__, 'Class', function() {
// public methods
	function Class( config ) {
		var Constructor = make_class( config = make_config( config ) );

		return config.singleton
			 ? make_singleton( Constructor, config.singleton )
			 : Constructor;
	}

// Class static methods
	function alias( name_current, name_alias ) {
		if ( util.type( this ) != desc_class_type.value )
			return null;

		var name, proto = this.prototype;

		if ( is_obj( name_current ) ) {
			for ( name in name_current )
				!util.has( name_current, name ) || alias.call( this, name, name_current[name] );
		}
		else if ( typeof proto[name_current] == 'function' )
			util.def( proto, name_alias, get_method_descriptor( proto, name_current ), true );

		return this;
	}

	function create() { return singleton( this ) || this.apply( Object.create( this.prototype ), arguments ); }

	function override( name, method ) { // todo: overriding constructor is not yet implemented
		if ( util.type( this ) != desc_class_type.value )
			return null;

		var proto = this.prototype;

		if ( is_obj( name ) ) {
			method = name;
			for ( name in method )
				!util.has( method, name ) || override.call( this, name, method[name] );
		}
		else if ( typeof method == 'function' )
			proto[name] = make_method( 'original', method, get_method_descriptor( proto, name ), name );

		return this;
	}

	function override_instance_method( name, method ) {
		if ( typeof method == 'function' )
			this[name] = make_method( 'original', method, get_method_descriptor( this, name ), name );

		return this;
	}

	function singleton( Constructor ) { return !Constructor ? null : Constructor[__singleton__] || null; }

// Class instance method helpers
	function get_args( args, fn_curr, fn_prev ) {
		if ( args.length && OP.toString.call( args[0] ) === '[object Arguments]' ) {
			if ( args.length < 2 && arguments.length > 1 ) {
				if ( fn_curr in internal_method_names )
					return get_args( args[0] );
				if ( fn_prev && fn_curr === fn_prev )
					return args[0];
			}
		}
		return args;
	}

	function get_method_descriptor( o, k ) {
		var desc = Object.getOwnPropertyDescriptor( o, k )
				|| ( typeof o[k] == 'function'
				   ? util.describe( o[k], 'cw' )
				   : desc_default_super );
		desc.writable = true;
		return desc;
	}

	function set_super_method( ctx, super_name, desc_super ) {
		util.def( ctx, super_name, desc_super, true );
		return ctx;
	}

// Class construction methods
	function add( key, value ) {
		var desc;
		switch ( typeof value ) {
			case 'object'   : desc = util.type( value ) == 'descriptor' ? value : util.describe( { value : value }, 'cw' );          break;
			case 'function' : desc = util.describe( make_method( 'parent', value, get_method_descriptor( this, key ), key ), 'cw' ); break;
			default         : desc = util.describe( value, 'cew' );
		}
		util.def( this, key, desc, true );
		return this.constructor;
	}

	function decorate( Constructor, config ) {
		util.def( Constructor, __type__, desc_class_type, true );
		util.defs( Constructor, {
			add      : add.bind( Constructor.prototype ),
			alias    : alias.bind( Constructor ),
			create   : create.bind( Constructor ),
			override : override.bind( Constructor )
		}, 'r', true );
		return Constructor;
	}

	function make_class( config ) {
		function Class() {
			var type = util.type( this );
			if ( !type || type == 'global' || util.type( this.constructor ) != 'class' )
				return create.apply( Class, arguments );

			if ( singleton( this.constructor ) )
				return this.constructor[__singleton__];

			if ( this[__processing__] !== true ) {
				this[__processing__] = true;
				process_before( this, arguments );
			}
//			this.constructor.valueOf() !== Constructor.valueOf() || process_before( this, arguments );

//			var return_value = get_return_value( this, Constructor.apply( this, arguments ) );
			var return_value = Constructor.apply( this, arguments );

			delete this[__processing__];

			return this[__chain__] === true && return_value === UNDEF ? this : return_value;
		}

		var super_class = config.extend,
			desc_chain  = config.chain === false || super_class.prototype[__chain__] === false
						? desc_false
						: desc_true,
			desc_super  = get_method_descriptor( super_class.prototype, 'constructor' ),
			ctor        = config.constructor || desc_super.value,
			name        = ctor ? ctor[__name__] : 'Anonymous',
			prototype   = Class.prototype = make_prototype( config ),
			Constructor = make_method( 'parent', ctor, desc_super, 'constructor' );

		prototype.constructor = Class;

		util.def( Class,     __guid__,   util.guid(), 'r',   true )
			.def( Class,     __super__,  desc_super,         true )
			.def( prototype, __chain__,  desc_chain,         true );

// this is over-written by id8.define, unless the Class was not created using id8.define
// this will allow us to try and keep things as nice as possible.
		   name in anon_list
		|| util.def( Class, __classname__, name, 'cw' )
			   .def( Class, 'displayName', name, 'cw' );

		make_processable( Class, config );

		return decorate( Class.mimic( ctor ) );
	}

	function make_config( descriptor ) {
		var class_config = util.merge( util.obj(), descriptor ),
			ctor         = class_config.constructor, name,
			super_class  = class_config.extend;

// weird shizzle in chrome is making me have to do shizzle like thizzle!!!
		if ( ( typeof class_config.extend == 'string' && typeof super_class != 'string' ) || ( typeof class_config.extend == 'function' && typeof super_class != 'function' ) )
			super_class  = class_config.extend;

// if extending then make sure we have a Class to extend from, or else extend Object
		if ( typeof super_class == 'string' )
			super_class = get( super_class );
		if ( typeof super_class != 'function' )
			super_class = Object;

// weird shizzle in chrome is making me have to do shizzle like thizzle!!!
		 if ( typeof class_config.extend == 'function' && super_class !== class_config.extend )
			super_class  = class_config.extend;

// make sure we have a constructor and if using the "extend", not Class
		( typeof ctor == 'function' && ctor !== Object ) || ( ctor = super_class.valueOf() );

// set a type for this Class' instances if one is not defined
		util.exists( class_config.type )
		|| ctor === Object
		|| ( name = String( ctor[__name__] ) ) in anon_list
		|| ( class_config.type = name.toLowerCase() );

		class_config.constructor = ctor && ctor !== Object ? ctor : super_class;
		class_config.extend      = super_class;

		return class_config;
	}

	function make_method( super_name, method, desc_super, method_name ) {
		var super_method = null;                                                // noinspection FallthroughInSwitchStatementJS
		switch ( typeof desc_super ) {
			case 'function' : desc_super   = util.describe( desc_super, 'cw' ); // allow fall-through
			case 'object'   : super_method = desc_super.value; break;
		}

		if ( !super_method )
			desc_super = desc_default_super;

		if ( !method || method.valueOf() === super_method.valueOf() ) {
			method     = super_method;
			desc_super = desc_default_super;
		}

		return function Class_instance_method() {
			var // desc             = get_method_descriptor( this, super_name ),
				previous_method  = this[__method__],
				return_value,
				no_update_method = previous_method in internal_method_names || method_name in internal_method_names,
				this_super       = this[super_name];

			this[super_name] = ( desc_super || desc_default_super ).value;

			if ( !no_update_method )
				this[__method__] = method_name;

			return_value = ( method || this[super_name] ).apply( this, get_args( arguments, method_name, previous_method ) );

			if ( !no_update_method )
				this[__method__] = previous_method;

			this[super_name] = this_super;

			return this[__chain__] === true && return_value === UNDEF ? this : return_value;
		}.mimic( method, method_name );
	}

	function add_processor( fn ) {
		typeof fn != 'function' || this.indexOf( fn ) > -1 || this.push( fn );
	}
	function make_processable( Class, config ) {
		var after = [], before = [], super_class = internals[config.extend[__guid__]];

		internals[Class[__guid__]] = {
			after  : after,
			before : before
		};

		if ( super_class ) {
			!Array.isArray( super_class.after  ) || super_class.after.forEach(  add_processor, after  );
			!Array.isArray( super_class.before ) || super_class.before.forEach( add_processor, before );
		}

		add_processor.call( after, config.afterdefine );
		add_processor.call( before, config.beforeinstance );

		return Class;
	}

	function make___proto__( super_class ) {
		return ( super_class !== Error && !is( super_class.prototype, Error ) )
			 ? Object.create( super_class.prototype )
			 : new super_class;
	}

	function make_prototype( class_config ) {
		var desc        = extract_default_properties( class_config, default_prop_names ),
			super_class = class_config.extend,
			processed   = util.obj(),
			prototype   = Object.reduce( desc, function( proto, value, key ) {
				processed[key] = true;
				key in internal_method_names || add.call( proto, key, value );
				return proto;
			}, make___proto__( super_class ) );

// this allows you to take advantage of method chaining, as well as being able to call "this.parent();" on a Class
// that has no Super Class, without throwing any errors...
		Object.getOwnPropertyNames( prototype ).forEach( function( key ) {
// skip non-methods and already processed properties
			key in processed || key in internal_method_names ||
			typeof this[key] != 'function' || add.call( this, key, util.describe( make_method( 'parent', this[key], desc_default_super, key ), 'cw' ) );
		}, prototype );

		typeof class_config.type != 'string' || util.def( prototype, __type__, class_config.type, 'c', true );

		if ( !( __override__ in prototype ) )
			prototype[__override__] = override_instance_method;
		if ( !( 'original'   in prototype ) )
			prototype.original = desc_default_super.value;
		if ( !( 'parent'     in prototype ) )
			prototype.parent   = desc_default_super.value;

		return prototype;
	}

	var default_prop_names    = 'afterdefine beforeinstance chain constructor extend singleton type'.split( ' ' ).reduce( to_obj, util.obj() ),
		desc_class_type       =  util.describe( 'class', 'r' ),
		desc_default_super    =  util.describe( make_method( 'parent', util.noop, util.describe( util.noop, 'cw' ), 'parent' ), 'cw' ),
		desc_false            =  util.describe( false,   'w' ),
		desc_true             =  util.describe( true,    'w' ),
		internal_method_names = 'mixin original parent'.split( ' ' ).reduce( to_obj, util.obj() );

	return Class;
}(), 'w' );



/*~  src/Source.js  ~*/

__lib__.define( namespace( 'Source' ), function() {
	function afterdefine( Class ) {
		var mixins = Class.prototype.mixins;

// if you don't know why you don't want an Object on a prototype, then you should definitely find out.
// Hint: Prototypical inheritance and Objects passed as references not copies...
		delete Class.prototype.mixins;

		decorate( Class ).mixin( mixins );

		return is_obj( mixins = Class[__super__][__mixins__] )
			 ? Class.mixin( mixins )
			 : Class;
	}

	function beforeinstance( Class, instance, args ) {
		instance.$mx = Class[__mixins__];
	}

	function decorate( Class ) {
		Class[__mixins__] = util.obj();
		Class.mixin       = mixins_apply.bind( Class );

		if ( typeof Class.prototype.mixin != 'function' )
			Class.prototype.mixin = mixin_exec;

		return Class;
	}

	function get_name( path ) {
		return String( path ).split( '.' ).pop().toLowerCase();
	}

	function mixin_apply( Class, mixin, name ) {
		if ( name in Class[__mixins__] )
			return Class;

		//noinspection FallthroughInSwitchStatementJS
		switch ( util.ntype( mixin ) ) {
			case 'object'   :                                  break;
			case 'string'   : if ( !( mixin = get( mixin ) ) ) break; // allowing fall-through if a Class is found,
			case 'function' : mixin = mixin.prototype;         break; // otherwise break out baby!!!
		}

		if ( mixin ) {
 // Since this is a mixin and not a super class we only want to add properties/methods that do not already exist to the Class
 // The rest can be called within the existing method as this.mixin( mixin_name, arguments );
			Object.getOwnPropertyNames( mixin ).map( function( property ) {
				property in reserved_props || property in this || Class.add( property, util.description( mixin, property ) );
			}, Class.prototype );

			util.def( Class[__mixins__], get_name( name ), { value : mixin }, 'e', true );
		}

		return Class;
	}

	function mixins_apply( mixins ) {
		switch ( util.ntype( mixins ) ) {
			case 'object'   : Object.reduce( mixins, mixin_apply, this );                                         break;
			case 'string'   : mixin_apply( this, mixins, get_name( mixins ) );                                    break;
			case 'function' : mixin_apply( this, mixins, get_name( mixins[__classname__] || mixins[__name__] ) ); break;
		}
		return this;
	}

	function mixin_exec( name, args ) {
		var mx     = this.$mx,
			method = this[__method__],
			return_value;

		switch ( arguments.length ) {
			case 2  :            break;
			case 1  : args = []; break;
			case 0  : name = []; break;
			default : args = Array.coerce( arguments, 1 );
		}

		if ( typeof name != 'string' ) { // warning! doing it this way cannot guarantee order of execution!
			args = name;

			Object.getOwnPropertyNames( mx ).map( function( name ) {
				this.mixin( name, args );
			}, this );

//			return get_return_value( this, UNDEF );
		}
		else
			return_value = mx[name] && typeof mx[name][method] == 'function' ? mx[name][method].apply( this, args ) : UNDEF;

		return this[__chain__] === true && return_value === UNDEF ? this : return_value;
//		return get_return_value( this, ( mx[name] && typeof mx[name][method] == 'function' ? mx[name][method].apply( this, args ) : UNDEF ) );
	}

	return {
		constructor    : function Source( config ) {
			this.applyConfig( this.initConfig( config ) );
			if ( this.path ) {                  // this allows us to create Class instances to within an AMD style
				util.define( this.path, this ); // environment without needing to wrap them all in IIFEs. it also means
				delete this.path;               // we can avoid a lot of refactoring, should we decided to not use AMD
			}
			this.autoInit === false || this.init();
		},
		afterdefine    : afterdefine,
		beforeinstance : beforeinstance,
		module         : __lib__,
// public properties
		$mx            : null,
		autoInit       : true,
		mixins         : null,
		path           : null,
// public methods
		mixin          : null, // this is set by `beforeinstance` to avoid weird behaviour
// constructor methods
		applyConfig : function( config ) {
			!is_obj( config ) || Object.keys( config ).forEach( function( key ) {
				if ( typeof config[key] == 'function' && typeof this[key] == 'function' ) // this allows you to override a method for a
					this[__override__]( key, config[key] );         // specific instance of a Class, rather than require
				else                                                // you extend the Class for a few minor changes
					this[key] = config[key];                        // NB: can also be achieved by creating a `singleton`
			}, this );

			util.def( this, __config__, { value : config }, 'r', true );
		},
		initConfig   : function( config ) {
			return is_obj( config ) ? config : util.obj();
		},
// internal methods
		init         : util.noop
	};
}() );



/*~  src/Callback.js  ~*/

__lib__.define( namespace( 'Callback' ), function() {
	function buffer() {
		if ( this[bid] ) return this;
		this[bid] = setTimeout( buffer_stop.bind( this ), this.buffer );
		return this.exec.apply( this, arguments );
	}
	function buffer_stop() { clearTimeout( this[bid] ); delete this[bid]; }
	function eventType( t ) { return t.indexOf( 'event' ) + 5 === t.length; }

	var bid = 'bufferId', tid = 'timeoutId';

	return {
		constructor : function Callback( fn, conf ) {
			util.copy( this, conf || {} );

			var fire = this.fire = this.handleEvent_ = ( util.type( this.buffer ) == 'number' ? buffer : this.exec ).bind( this );

			this.fn  = fn;
			fire.cb  = this;
			this.args || ( this.args = [] );
			this.ctx  || ( this.ctx  = this );

			if ( typeof this.delay != 'number' || isNaN( this.delay ) )
				this.delay = null;
			if ( typeof this.times != 'number' || isNaN( this.times ) || this.times < 0 )
				this.times = 0;

			this.enable();
		},
		extend      : Object,
		module      : __lib__,
// properties
		args        : null,
		buffer      : null,
		bufferId    : null,
		count       : 0,
		ctx         : null,
		delay       : null,
		timeoutId   : null,
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
		stop        : function() { !this[tid] || clearTimeout( this[tid] ), delete this[tid]; }
	};
}() );



/*~  src/Hash.js  ~*/

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
		get         : function( key ) {
			var c = cache[this[ID]], k, v;

			if ( key in c )
				return c[key];

// this here is dedicated to shiternet explorer
			k = this.okeys;
			v = this.ovalues;

			return k.length
				 ? v[k.indexOf( key )] || null
				 : null;
		},
		has         : function( k ) { return k in cache[this[ID]]; },
		key         : function( v ) { return Object.key( cache[this[ID]], v ); },
		reduce      : function( fn, val ) {
			var H = this, o = cache[H[ID]];
			return Object.keys( o ).reduce( function( res, k, i ) { return fn.call( H, res, o[k], k, H, i ); }, val );
		},
		remove      : function( k ) {
			if ( k in cache[this[ID]] ) {
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



/*~  src/Observer.js  ~*/

__lib__.define( namespace( 'Observer' ), function() {
	function broadcast( args, cb ) {
		if ( typeof cb.handleEvent != 'function' ) return true;

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
		switch( util.ntype( config ) ) {
			case 'boolean' : config = { times : !!config ? 1 : 0 };     break;
			case 'number'  : config = { delay :   config };             break;
			case 'object'  : config = util.merge( util.obj(), config ); break;
			default        : config = util.obj();
		}

		if ( 'single' in config ) {
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

		typeof fn != 'string' || ( fn = ctx[fn] );

		while ( cb = queue[++i] ) {
			if ( cb === fn || ( cb.fn === fn && cb.ctx === ctx ) ) {
				return i;
			}
		}
		return -1;
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
			return typeof cb.handleEvent == 'function' ? cb.handleEvent.apply( cb, arguments ) : U;
		};
	}

	function observe( observer, listeners ) {
		listeners = util.copy( util.obj(), listeners );

		if ( !listeners.ctx )
			listeners.ctx = observer;

		if ( 'options' in listeners )
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

		var ctx = listeners.ctx, fn, options = listeners.options, type = util.type( listener );

		switch ( type ) {
			case type_callback :
				fn  = listener;
				break;

			case 'function'    : case 'array'  : case 'string' :
				fn  = listener;
				break;

			case 'nullobject'  : case 'object' :
				fn      = listener.fn;
				ctx     = listener.ctx || ctx;
				options = 'options' in listener ? createCallbackConfig( listener.options ) : options;
				break;
		}

		observer.observe( event, fn, ctx, options );

		return observer;
	}

	function relay() { return this.broadcast.apply( this, arguments ); }

	function wildCardEsc( evt ) { return String( evt ).toLowerCase().replace( re_wc, '.*' ); }

	var re_wc = /\*/g, type_callback = Name + '-callback';

	return {
		constructor        : function Observer( observers ) {
			this.listeners = __lib__( 'Hash' );

			!is_obj( observers ) || this.observe( is_obj( observers.observers ) ? observers.observers : observers );
		},
		extend             : Object,
		module             : __lib__,

// public properties
		broadcasting       : false,
		destroyed          : false,
		destroying         : false,
		listeners          : null,
		observer_suspended : false,

// public methods
		broadcast          : function( event ) {
			if ( this.destroyed || this.observer_suspended || !this.listeners.length || !event ) return;

			event     = String( event ).toLowerCase();

			var queue = getListeners( this, event ); // in any case will return a different array to the queue to ensure
													 // any listeners added or removed during broadcast don't affect the
													 // current broadcast

			if ( !queue.length ) return; 			 // if no event queue, then don't even bother

			this.broadcasting = event;

// if a callback returns false then we want to stop broadcasting, every will do this, forEach won't!
			queue.every( broadcast.bind( this, Array.coerce( arguments, 1 ) ) );

			this.broadcasting = false;
		},
		buffer             : function( ms, evt, fn, ctx, options ) {
			is_obj( options ) || ( options = util.obj() ); options.buffer = Number( ms );
			this.observe( evt, fn, ctx, options );
		},
		delay              : function( ms, evt, fn, ctx, options ) {
			is_obj( options ) || ( options = util.obj() ); options.delay = Number( ms );
			this.observe( evt, fn, ctx, options );
		},
		destroy            : function() {
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
		ignore             : function( event, fn, ctx ) {
			event = wildCardEsc( event.toLowerCase() );

			var queue = this.listeners.get( event ), i, o;

			if ( !Array.isArray( queue ) || !queue.length ) return;

			var index = findIndex( this, queue, fn, ctx );

			!~index || queue.splice( index, 1 );
		},
		observe            : function( event, fn, ctx, options ) {
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
					case 'nullobject' :
						if ( 'handleEvent' in fn ) {
							if ( is_obj( ctx ) && options === U )
								options = ctx;
							ctx = fn;
							fn  = handleEvent( fn );
						}
						break;

					case 'string'     :
						if ( is_obj( ctx ) )
							fn  = ctx[fn];
						else if ( typeof this[fn] == 'function' ) {
							fn  = this[fn];
							ctx = this;
						}
						break;
				}
				queue.push( createCallback( fn, createCallbackConfig( options, ctx || this ) ) );
			}
		},
		once               : function( evt, fn, ctx, options ) {
			is_obj( options ) || ( options = util.obj() );
			options.single = true;
			this.observe( evt, fn, ctx, options );
		},
		purgeObservers     : function( event ) {
			event ? this.listeners.set( wildCardEsc( event ), [] ) : this.listeners.clear();
		},
		relayEvents        : function( target_observer ) {
			var e = Array.coerce( arguments, 1 ), evt;
			while ( evt = e.shift() )
				this.observe( evt, createRelayCallback( this, target_observer, evt ), target_observer );
		},
		resumeEvents       : function() {
			if ( !this.observer_suspended ) return;

			this.observer_suspended = false;
			this.broadcast( 'observer:resumed' );
		},
		suspendEvents      : function() {
			if ( this.observer_suspended ) return;

			this.broadcast( 'observer:suspended' );
			this.observer_suspended = true;
		},

// internal methods
		_destroy       : util.noop,
		onDestroy      : util.noop
	};
}() );



/*~  src/nativex.js  ~*/

	util.x.cache( 'Function', function( Type ) {
		util.def( Type.prototype, 'callback', function( conf ) {
			return ( new __lib__.Callback( this, conf ) ).fire.mimic( this );
		}, 'w' );
	} );



/*~  src/expose.js  ~*/

	util.iter( PACKAGE ) || ( PACKAGE = util.ENV == 'commonjs' ? module : util.global );

	util.defs( ( __lib__ = util.expose( __lib__, Name, PACKAGE ) ), {
		get      : get,  is       : is,
		type     : type, register : register
	}, 'w', true );

	util.expose( util, __lib__ );           // store a reference to m8 on id8
	util.def( __lib__, 'util', util, 'w' ); // store a reference as util as well so we can avoid hard reference in other libs

	anon_list.Class                 = true; // add these two method names to the anonymous function names list
	anon_list.Class_instance_method = true; // this will give us more clarity when debugging

// extend Function and Object natives with id8's extensions if not sandboxed
// or sandboxed environment's natives with all m8 AND id8 extensions
	util.x( Object, Array, Boolean, Function );



// at this point we don't know if m8 is available or not, and as such do not know what environment we are in.
// so, we check and do what is required.
}( ( typeof m8 != 'undefined' ? m8 : typeof require != 'undefined' ? require( 'm8' ) : null ), 'id8' );
