__lib__.define( namespace( 'Source' ), function() {
	function afterdefine( Class ) {
		var mixins = Class.prototype.mixins;

// if you don't know why you don't want an Object on a prototype, then you should definitely find out.
// Hint: Prototypical inheritance and Objects passed as references not copies...
		delete Class.prototype.mixins;

		decorate( Class ).mixin( mixins );

		return is_obj( mixins = Class[__super__][__mixins__] )
			 ? Class.mixin( mixins )
			 : Class;
	}

	function beforeinstance( Class, instance, args ) {
		instance.$mx = Class[__mixins__];
	}

	function decorate( Class ) {
		Class[__mixins__] = util.obj();
		Class.mixin       = mixins_apply.bind( Class );

		if ( typeof Class.prototype.mixin != 'function' )
			Class.prototype.mixin = mixin_exec;

		return Class;
	}

	function get_name( path ) {
		return String( path ).split( '.' ).pop().toLowerCase();
	}

	function mixin_apply( Class, mixin, name ) {
		if ( name in Class[__mixins__] )
			return Class;

		//noinspection FallthroughInSwitchStatementJS
		switch ( util.ntype( mixin ) ) {
			case 'object'   :                                  break;
			case 'string'   : if ( !( mixin = get( mixin ) ) ) break; // allowing fall-through if a Class is found,
			case 'function' : mixin = mixin.prototype;         break; // otherwise break out baby!!!
		}

		if ( mixin ) {
 // Since this is a mixin and not a super class we only want to add properties/methods that do not already exist to the Class
 // The rest can be called within the existing method as this.mixin( mixin_name, arguments );
			Object.getOwnPropertyNames( mixin ).map( function( property ) {
				property in reserved_props || property in this || Class.add( property, util.description( mixin, property ) );
			}, Class.prototype );

			util.def( Class[__mixins__], get_name( name ), { value : mixin }, 'e', true );
		}

		return Class;
	}

	function mixins_apply( mixins ) {
		switch ( util.ntype( mixins ) ) {
			case 'object'   : Object.reduce( mixins, mixin_apply, this );                                         break;
			case 'string'   : mixin_apply( this, mixins, get_name( mixins ) );                                    break;
			case 'function' : mixin_apply( this, mixins, get_name( mixins[__classname__] || mixins[__name__] ) ); break;
		}
		return this;
	}

	function mixin_exec( name, args ) {
		var mx     = this.$mx,
			method = this[__method__],
			return_value;

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

//			return get_return_value( this, UNDEF );
		}
		else
			return_value = mx[name] && is_fun( mx[name][method] ) ? mx[name][method].apply( this, args ) : UNDEF;

		return this[__chain__] === true && return_value === UNDEF ? this : return_value;
//		return get_return_value( this, ( mx[name] && is_fun( mx[name][method] ) ? mx[name][method].apply( this, args ) : UNDEF ) );
	}

	return {
		constructor    : function Source( config ) {
			this.applyConfig( this.initConfig( config ) );
			if ( this.path ) {                  // this allows us to create Class instances to within an AMD style
				util.define( this.path, this ); // environment without needing to wrap them all in IIFEs. it also means
				delete this.path;               // we can avoid a lot of refactoring, should we decided to not use AMD
			}
			this.autoInit === false || this.init();
		},
		afterdefine    : afterdefine,
		beforeinstance : beforeinstance,
		module         : __lib__,
// public properties
		$mx            : null,
		autoInit       : true,
		mixins         : null,
		path           : null,
// public methods
		mixin          : null, // this is set by `beforeinstance` to avoid weird behaviour
// constructor methods
		applyConfig : function( config ) {
			!is_obj( config ) || Object.keys( config ).forEach( function( key ) {
				if ( is_fun( config[key] ) && is_fun( this[key] ) ) // this allows you to override a method for a
					this[__override__]( key, config[key] );         // specific instance of a Class, rather than require
				else                                                // you extend the Class for a few minor changes
					this[key] = config[key];                        // NB: can also be achieved by creating a `singleton`
			}, this );

			util.def( this, __config__, { value : config }, 'r', true );
		},
		initConfig   : function( config ) {
			return is_obj( config ) ? config : util.obj();
		},
// internal methods
		init         : util.noop
	};
}() );
