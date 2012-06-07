;!function() {
	function Class( setup ) {
		var config      = make_configuration( setup ),
			Constructor = make_class( config );

		return config.singleton
			 ? make_singleton( Constructor, config )
			 : Constructor;
	}

	function create() { return singleton( this ) || this.apply( Object.create( this.prototype ), arguments ); }

	function decorate( Constructor ) {
		util.def( Constructor, 'create',      util.describe( create.bind(  Constructor ), 'r' ), true );
		util.def( Constructor, __type__,      class_type, true );
		return Constructor;
	}

	function extract_prototype_descriptors( config ) { return Object.keys( config ).reduce( function( o, k ) {
		if ( !util.got( default_prop_names, k ) ) {
			o[k] = config[k];
			delete config[k];
		}
		return o;
	}, util.obj() ); }

	function get_descriptor( o, k ) {
		var descriptor = Object.getOwnPropertyDescriptor( o, k ) || ( typeof o[k] == 'function' ? util.describe( o[k], 'cw' ) : default_super_descriptor );
		descriptor.writable = true;

		return descriptor;
	}

	function is( instance, Class ) {
		switch ( typeof Class ) {
			case 'function' : return instance instanceof Class;
			case 'string'   : return ( Class = getClass( Class ) ) ? ( instance instanceof Class ) : false;
		}
		return false;
	}

	function make_class( config ) {
		function Class_constructor() {
			return this instanceof Class_constructor
				 ? singleton( this.constructor )
				|| Constructor.apply( this, arguments )
				 : create.apply( Class_constructor, arguments );
		}

		var constructor                         = config.constructor,
			super_descriptor                    = get_descriptor( config.extend.prototype, 'constructor' ),
			Constructor                         = make_method( constructor, super_descriptor );
		Class_constructor.prototype             = make_prototype( config );
		Class_constructor.prototype.constructor = Class_constructor;

		util.def( Class_constructor, __super__, super_descriptor, true );

		if ( constructor[__name__] != 'anonymous' )
			util.def( Class_constructor, __classname__, util.describe( constructor[__name__], 'w' ) );

		return decorate( Class_constructor.mimic( constructor ) );
	}

	function make_configuration( setup ) {
		var config = Object.keys( setup || util.obj()  ).reduce( function( o, k ) {
			o[k] = setup[k];
			return o;
		}, util.obj() );

		if ( typeof config.extend == 'string' )
			config.extend = registered_path[config.extend] || registered_type[config.extend];
		if ( typeof config.extend != 'function' )
			config.extend = Object;
		if ( typeof config.constructor != 'function' || config.constructor === Object )
			config.constructor = config.extend.valueOf(); // performance: make sure we have original, not Class_constructor
		if ( typeof config.type != 'string' && config.constructor !== Object && config.constructor.__name__ != 'anonymous' )
			config.type = String( config.constructor.__name__ ).toLowerCase();

		return config;
	}

	function make_method( method, super_descriptor, name ) {
		super_descriptor = typeof super_descriptor != 'object'
						|| method.valueOf() === super_descriptor.value.valueOf()
						 ? default_super_descriptor
						 : super_descriptor
						|| default_super_descriptor;

		return function Class_instance_method() {
			var a = arguments, descriptor = get_descriptor( this, 'parent' ), return_value, u;

			util.def( this, 'parent', ( super_descriptor || default_super_descriptor ), true );
			return_value = method.apply( this, ( util.tostr( a[0] ) === '[object Arguments]' ? a[0] : a ) );
			util.def( this, 'parent', descriptor, true );

			return this.chain !== false && return_value === u ? this : return_value;
		}.mimic( method, name );
	}

	function make_prototype( config ) {
		var descriptor  = extract_prototype_descriptors( config ),
			super_class = config.extend,
			processed   = util.obj(),
			prototype   = Object.create( super_class.prototype );

		Object.keys( descriptor ).forEach( function( k ) {
			var description = descriptor[k];

			switch ( util.nativeType( description ) ) {
				case 'object'   : break;
				case 'function' : description = util.describe( make_method( description, get_descriptor( prototype, k ), k ), 'cw' ); break;
				default         : description = util.describe( description, 'ew' );
			}

			processed[k] = true;

			util.def( prototype, k, description, true );
		} );

// this allows you to call "this.parent();" on a Class that has no Super Class, without throwing any errors...
		Object.getOwnPropertyNames( prototype ).forEach( function( k ) {
			if ( k in processed || typeof prototype[k] != 'function' ) return; // skip already processed properties
			util.def( prototype, k, util.describe( make_method( prototype[k], default_super_descriptor ), 'cw' ), true );
		} );

		util.def( prototype, __type__, util.describe( config.type, 'w' ), true );
		util.def( prototype, 'parent',   default_super_descriptor,        true );

		return prototype;
	}

	function make_singleton( Constructor, config ) {
		var instance = config.singleton === true
					 ? new Constructor
					 : Constructor.create.apply( null, [].concat( config.singleton ) );

		util.def( Constructor, __singleton__, util.describe( { value : instance }, 'r' ) );

		return instance;
	}

	function match_type( Class, type ) {
		return Class[__classname__] === type || Class.prototype[__type__] === type;
	}

	function singleton( Constructor ) { return !Constructor ? null : Constructor[__singleton__] || null; }

	function to_obj( o, k ) {
		o[k] = true;
		return o;
	}

	function type( instance ) {
		var constructor = instance.constructor,
			type        = constructor[__classname__] || constructor[__name__];
		return type === 'Class_constructor' ? 'Anonymous' : type;
	}

	var class_type               =  util.describe( 'class', 'r' ),
		default_prop_names       = 'constructor extend mixin singleton type'.split( ' ' ).reduce( to_obj, util.obj() ),
		default_super_descriptor =  util.describe( util.noop, 'cw' );

	util.defs( __lib__, { Class : Class, is : is, type : type }, 'r' );
}();
