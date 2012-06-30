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
