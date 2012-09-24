__lib__.define( namespace( 'Source' ), function() {
	function afterdefine( Class  ) {
		var mixins = Class.prototype.mixins || util.obj(), name;

		delete Class.prototype.mixins;

		decorate( Class ).mixin( mixins );

		mixins = Class[__super__][__mixins__];

		if ( is_obj( mixins ) && util.len( mixins ) )
			for ( name in mixins )
				!util.has( mixins, name ) || util.got( Class.mixins, name ) || Class.mixin( name, mixins[name] );

		return Class;
	}

	function decorate( Class ) {
		util.def( Class, __mixins__, { value : util.obj() },     'w', true );
		util.def( Class,  'mixin',   mixins_apply.bind( Class ), 'w', true );

		if ( !is_fun( Class.prototype.mixin ) )
			Class.prototype.mixin = mixin_exec;

		return Class;
	}

	function get_name( path ) {
		return String( path ).split( '.' ).pop().toLowerCase();
	}

	function mixin_apply( Class, mixin, name ) {
		//noinspection FallthroughInSwitchStatementJS
		switch ( util.nativeType( mixin ) ) {
			case 'object'   :                                  break;
			case 'string'   : if ( !( mixin = get( mixin ) ) ) break; // allowing fall-through if a Class is found,
			case 'function' : mixin = mixin.prototype;         break; // otherwise break out baby!!!
		}

		if ( mixin ) {
 // Since this is a mixin and not a super class we only want to add properties/methods that do not already exist to the Class
 // The rest can be called within the existing method as this.mixin( mixin_name, arguments );
			Object.getOwnPropertyNames( mixin ).map( function( property ) {
				util.has( this, property ) || Class.add( property, mixin[property] );
			}, Class.prototype );

			util.def( Class[__mixins__], get_name( name ), { value : mixin }, 'e', true );
		}
		return Class;
	}

	function mixins_apply( mixins ) {
		switch ( util.nativeType( mixins ) ) {
			case 'object'   : Object.reduce( mixins, mixin_apply, this );                                         break;
			case 'string'   : mixin_apply( this, mixins, get_name( mixins ) );                                    break;
			case 'function' : mixin_apply( this, mixins, get_name( mixins[__classname__] || mixins[__name__] ) ); break;
		}
		return this;
	}

	function mixin_exec( name, args ) {
		var mx     = this.constructor[__mixins__],
			method = this[__method__];

		switch ( arguments.length ) {
			case 2  :            break;
			case 1  : args = []; break;
			case 0  : name = []; break;
			default : args = Array.coerce( arguments, 1 );
		}

		if ( !is_str( name ) ) { // warning! doing it this way cannot guarantee order of execution!
			args = name;

			Object.getOwnPropertyNames( mx ).map( function( name ) {
				this.mixin( name, args );
			}, this );

			return;
		}

		if ( mx[name] && is_fun( mx[name][method] ) )
			return mx[name][method].apply( this, args );
	}

	return {
		constructor    : function Source( config ) {
			this.applyConfig( this.initConfig( config ) );
			this.autoInit === false || this.init();
		},
		afterdefine    : afterdefine,
		module         : __lib__,
// public properties
		mixins         : null,
// public methods
// constructor methods
// internal methods
		applyConfig : function( config ) {
			util.copy( this, config );
		},
		initConfig   : function( config ) {
			if ( !is_obj( config ) )
				config = util.obj();

			util.def( this, __config__, { value : config }, 'r', true );

			return this[__config__];
		},
		init         : function() {}
	};
}() );
