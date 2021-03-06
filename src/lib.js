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
