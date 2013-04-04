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
		else if ( is_fun( proto[name_current] ) )
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
		else if ( is_fun( method ) )
			proto[name] = make_method( 'original', method, get_method_descriptor( proto, name ), name );

		return this;
	}

	function override_instance_method( name, method ) {
		if ( is_fun( method ) )
			this[name] = make_method( 'original', method, get_method_descriptor( this, name ), name );

		return this;
	}

	function singleton( Constructor ) { return !Constructor ? null : Constructor[__singleton__] || null; }

// Class instance method helpers
	function get_args( args, fn_curr, fn_prev ) {
		if ( args.length && util.tostr( args[0] ) === '[object Arguments]' ) {
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
				|| ( is_fun( o[k] )
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
		switch ( util.ntype( value ) ) {
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

			this.constructor.valueOf() !== Constructor.valueOf() || process_before( this, arguments );

			return get_return_value( this, Constructor.apply( this, arguments ) );
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

		make_processable( Class, config );

// this is over-written by id8.define, unless the Class was not created using id8.define
// this will allow us to try and keep things as nice as possible.
		   util.got( anon_list, name )
		|| util.def( Class, __classname__, name, 'cw' )
			   .def( Class, 'displayName', name, 'cw' );

		return decorate( Class.mimic( ctor ) );
	}

	function make_config( descriptor ) {
		var class_config = util.merge( util.obj(), descriptor ),
			ctor         = class_config.constructor, name,
			super_class  = class_config.extend;

// weird shizzle in chrome is making me have to do shizzle like thizzle!!!
		if ( ( is_str( class_config.extend ) && !is_str( super_class ) ) || ( is_fun( class_config.extend ) && !is_fun( super_class ) ) )
			super_class  = class_config.extend;

// if extending then make sure we have a Class to extend from, or else extend Object
		!is_str( super_class ) || ( super_class = get( super_class ) );
		 is_fun( super_class ) || ( super_class = Object );

// weird shizzle in chrome is making me have to do shizzle like thizzle!!!
		 if ( is_fun( class_config.extend ) && super_class !== class_config.extend )
			super_class  = class_config.extend;

// make sure we have a constructor and if using the "extend", not Class
		( is_fun( ctor ) && ctor !== Object ) || ( ctor = super_class.valueOf() );

// set a type for this Class' instances if one is not defined
		util.exists( class_config.type )
		|| ctor === Object
		|| util.got( anon_list, ( name = String( ctor[__name__] ) ) )
		|| ( class_config.type = name.toLowerCase() );

		class_config.constructor = ctor && ctor !== Object ? ctor : super_class;
		class_config.extend      = super_class;

		return class_config;
	}

	function make_method( super_name, method, desc_super, method_name ) {
		var super_method = null;                                                // noinspection FallthroughInSwitchStatementJS
		switch ( util.ntype( desc_super ) ) {
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
			var desc             = get_method_descriptor( this, super_name ),
				previous_method  = this[__method__],
				return_value,
				no_update_method = util.got( internal_method_names, previous_method, method_name );

			set_super_method( this, super_name, desc_super );

			no_update_method || util.def( this, __method__, method_name, 'w', true );

			return_value = ( method || desc_super.value ).apply( this, get_args( arguments, method_name, previous_method ) );

			no_update_method || util.def( this, __method__, previous_method, 'w', true );

			set_super_method( this, super_name, desc );

			return get_return_value( this, return_value );
		}.mimic( method, method_name );
	}

	function make_processable( Class, config ) {
		var after = [], before = [], super_class = internals[config.extend[__guid__]];

		internals[Class[__guid__]] = {
			after  : after,
			before : before
		};

		if ( super_class ) {
			!Array.isArray( super_class.after  ) || after.push.apply(  after,  super_class.after  );
			!Array.isArray( super_class.before ) || before.push.apply( before, super_class.before );
		}

		!is_fun( config.afterdefine    ) || after.push(  config.afterdefine    );
		!is_fun( config.beforeinstance ) || before.push( config.beforeinstance );

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
			 key in processed    || key in internal_method_names ||
			!is_fun( this[key] ) || add.call( this, key, util.describe( make_method( 'parent', this[key], desc_default_super, key ), 'cw' ) );
		}, prototype );

		!is_str( class_config.type ) || util.def( prototype, __type__, class_config.type, 'c', true );

		__override__ in prototype || util.def( prototype, __override__, override_instance_method, 'w', true );
		'original'   in prototype || util.def( prototype, 'original',   desc_default_super,       'w', true );
		'parent'     in prototype || util.def( prototype, 'parent',     desc_default_super,       'w', true );

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
