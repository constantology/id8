!function() {
// id8 is THE factory method for creating any class instance of a class created using id8.Class
// that is why it is assinged in here, defined in id8.js
	id8 = function( n ) {
		var C = m8.type( n ) == 'class' ? n : reg_type[n] || reg_type['id8_' + n] || reg_path[n];

		if ( !C ) new Error( n + ' does not match any registered id8.Class.' );

		return C.create.apply( null, Array.coerce( arguments, 1 ) );
	};

	function Class( path, desc ) {
		if ( !desc && m8.nativeType( path ) == 'object' ) {
			desc = path; path = '';
		}

		var C, name, ns, _ctor, type,
			_proto    = m8.obj(),
			_super    = desc.extend || Object,
			mod       = desc.module,
			mixin     = desc.mixin  || dumb,
			singleton = desc.singleton;

		m8.nativeType( _super ) != 'string' || ( _super = reg_path[_super] || reg_type[_super] );

		_ctor = desc.constructor !== Object ? desc.constructor : _super;

		if ( path ) {
			ns   = path.split( '.' );
			name = ns.pop();
			ns   = m8.bless( ns, mod );
		}

		m8.def( _proto, 'parent',      desc_noop, true );

		m8.def( _proto, 'constructor', m8.describe( ctor( _ctor, _super, name, _proto ), 'w' ), true );

		type = getType( desc.type || path, ( C = _proto.constructor ) );

		m8.def(  C,     '__type__',    m8.describe( 'class', 'w' ), true );
		m8.def( _proto, '__type__',    m8.describe(  type,   'w' ), true );

		Object.remove( desc, defaults );

		C.prototype = apply( _proto, m8.copy( desc, mixin ) );
		m8.def( C, 'create', m8.describe( create( extend( C, _super ) ), 'w' ), true );

		path = path.replace( re_root, '' );

		if ( singleton ) {
			m8.def( C, 'singleton', m8.describe( { value : ( singleton === true ? new C : C.create.apply( C, [].concat( singleton ) ) ) }, 'w' ) );
			register( C, path, type );
			C = C.singleton;
		}
		else if ( path ) register( C, path, type );

		!( name && ns ) || m8.def( ns, name, m8.describe( { value : C }, 'w' ) );

		return C;
	}

	function apply( proto, desc ) {
		Object.reduce( desc, function( p, v, k ) {
			switch( m8.nativeType( v ) ) {
				case 'object' : m8.def( p, k, v, true ); break;
				default       : p[k] = v;
			}
			return p;
		}, proto );
		return proto;
	}

	function create( C ) { return function create() { return singleton( C ) || C.apply( Object.create( C.prototype ), arguments ); }; }

	function ctor( m, s, name, P ) {
		var C    = wrap( m, s, name ),
			Ctor = function() {
				var ctx = this === U ? null : this, ctor = ctx ? ctx.constructor : null;
				return singleton( ctor ) || C.apply( ( is( ctx, Ctor ) ) ? ctx : Object.create( P ), arguments );
			};
		return Ctor.mimic( m, name );
	}

	function extend( C, Sup ) {
		if ( !( '__super' in C.prototype ) ) {
			var p = C.prototype, sp = Sup.prototype;

			Object.keys( sp ).forEach( function( k ) {
				if ( k in reserved ) return;
				switch ( m8.type( sp[k] ) ) {
					case 'function' : ( p[k] = m8.nativeType( p[k] ) != 'function' ? wrap( sp[k], m8.noop, k ) : wrap( p[k], sp[k], k ) ); break;
					default         : k in p || m8.def( p, k, Object.getOwnPropertyDescriptor( sp, k ), true );
				}
			} );

			Object.keys( p ).forEach( function( k ) { // this allows the calling of "this.parent();" on a Class with no __super without throwing any errors
				!( m8.nativeType( p[k] ) == 'function' && ( !( k in sp ) || p[k].valueOf() !== sp[k].valueOf() ) ) || ( p[k] = wrap( p[k], m8.noop, k ) );
			} );

			sp = m8.describe( { value : Object.create( Sup.prototype ) }, 'w' );
			m8.def( C,           '__super', sp );
			m8.def( C.prototype, '__super', sp );
		}
		return C;
	}

	function getType( type, ctor ) { return ( !m8.empty( type ) ? type.replace( re_root, '' ).replace( re_dot, '_' ) : ctor.__name__ ).toLowerCase(); }

	function is( o, C ) {
		if ( o && C ) {
			if ( o instanceof C ) return true;
			if ( !( o = o.constructor ) ) return false;
			do { if ( o === C ) return true; }
			while ( o.__super && ( o = o.__super.constructor ) );
		}
		return false;
	}

	function register( C, path, type ) {
		var err, err_msg = path + ERR_MSG;

		!path || !( path in reg_path ) || ( err = true, console.log( err_msg + 'Class' ) );
		!type || !( type in reg_type ) || ( err = true, console.log( err_msg + 'Type'  ) );

		if ( err ) new Error( 'id8.Class overwrite error.' );

		reg_path[path] = reg_type[type] = C;
	}

	function singleton( C ) { return !C ? null : C.singleton || null; }

	function type( c ) {
		var ctor = c.constructor, k;
		for ( k in reg_path ) if ( reg_path[k] === ctor ) return k;
		return ctor.__name__ != 'anonymous' ? ctor.__name__ : 'Anonymous';
	}

	function wrap( m, s, name ) {
		return function() {
			var o, p = Object.getOwnPropertyDescriptor( this, 'parent' ) || desc_noop;
			p.writable = true;
			m8.def( this, 'parent', ( s ? m8.describe( s, 'cw' ) : desc_noop ), true );
			o = m.apply( this, arguments );
			m8.def( this, 'parent', p, true );
			return this.chain !== false && o === U ? this : o;
		}.mimic( m, name );
	}

	var ERR_MSG   = ' already exists. Cannot override existing ',
		defaults  = ( 'constructor extend mixin module singleton type' ).split( ' ' ),
		desc_noop = m8.describe( m8.noop, 'cw' ),
		dumb      = m8.obj(), re_dot   = /\./g,    re_root  = /^\u005E/,
		reg_path  = m8.obj(), reg_type = m8.obj(), reserved = m8.obj(); // <- Object.create( null ); resolves issue in safari with using {}

	reserved.constructor = reserved.parent = reserved.__super = reserved.__type__ = true;

	m8.defs( id8, { Class : Class, is : is, type : type }, 'w' );
}();
