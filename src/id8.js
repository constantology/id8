	function __lib__( name_or_type ) {
		var Class = typeof name_or_type == 'function' && util.type( name_or_type ) == 'class'
				  ? name_or_type
				  : getClass( name_or_type );

		if ( !Class )
			throw new Error( Name + ' factory: No Class found with a name or type of ' + name_or_type );

		return Class.create.apply( null, Array.coerce( arguments, 1 ) );
	}

	function NS( name ) { return '^' + Name + '.' + name; }

	function define( name, descriptor ) {
		var Class, Constructor, module = descriptor.module, namespace = name.split( '.' ), path;

		delete descriptor.module;
		name  = name.replace( re_valid_name, '' );
		descriptor.type || ( descriptor.type = name.toLowerCase().split( '.' ).join( '-' ) );
		Class       = __lib__.Class( descriptor );
		Constructor = Class.constructor[__singleton__] ? Class.constructor : Class;
		path        = util.bless( namespace.slice( 0, -1 ), module );

		util.def( Constructor, __classname__, util.describe( name, 'w' ), true );
		register( Constructor );

		return ( path[namespace.pop()] = Class );
	}

	function getClass( name_or_type ) {
		return registered_path[name_or_type]              || registered_type[name_or_type]
			|| registered_path[Name + '.' + name_or_type] || registered_type[lc_Name + '-' + name_or_type];
	}

	function register( Class ) {
		var name = Class[__classname__], type = Class.prototype[__type__];
		if ( name in registered_path || type in registered_type )
			throw new Error( Name + '.define: there is already a Class called: ' + name );
		return ( registered_path[name] = registered_type[type] = Class );
	}

	function sequence( property, Class ) {
		var res = [], val;
		typeof Class != 'object' || ( Class = Class.constructor );

		if ( typeof Class == 'function' && util.type( Class ) == 'class' ) {
			do { !( val = Object.value( Class, property ) ) || res.push( val ); }
			while ( Class = Class[__super__] );
		}

		return res;
	}

	var __classname__   = '__classname__', // todo: replace hard refs with these!!!
		__name__        = '__name__',
		__singleton__   = '__singleton__',
		__super__       = '__super__',
		__type__        = '__type__',
		lc_Name         = Name.toLowerCase(),
		re_valid_name   = /[^A-Za-z0-9_\.]/g,
		registered_path = util.obj(),
		registered_type = util.obj(),
		sequence_class  = sequence.bind( null, __classname__ ),
		sequence_type   = sequence.bind( null, 'prototype.' + __type__ );

	util.defs( __lib__, {
		__name__ : { value : Name      },
		__type__ : { value : 'library' },
		define   : define,
		getClass : getClass
	}, 'w', true );
