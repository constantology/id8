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

// weird shizzle in chrome is making me have to do shizzle like thizzle!!!
		Constructor = class_config.singleton
					? ( Class = ( is_fun( Class )
						? Class.create.apply( null, class_config.singleton === true ? [] : [class_config.singleton] )
						: Class ) ).constructor
					: Class;
//		Constructor = class_config.singleton ? Class.constructor : Class;

		util.def( Constructor.prototype, __type__, type_name, 'c', true );
		decorate( Constructor, class_name, descriptor.noreg === true );

		  !descriptor.alias
		|| descriptor.alias.split( ' ' ).map( function( alias ) {
			registered_alias[alias] = this;
		}, Constructor );

		class_config.singleton || process_after( Constructor );

		if ( is_str( descriptor.path ) && util.AMD )
			util.define( descriptor.path, Class );

		return Class;
//		return class_config.singleton && is_fun( Class ) ? Class() : Class;
	}

	function decorate( Class, class_name, no_register ) {
		!class_name || util.def( Class, __classname__, class_name, 'cw', true );
		return no_register ? Class : register( Class );
	}

	var default_prop_names = 'alias module noreg path'.split( ' ' ).reduce( to_obj, util.obj() );

	return define;
}(), 'w' );
