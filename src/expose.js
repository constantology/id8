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
