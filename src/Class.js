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
