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
