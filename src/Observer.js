id8.Class( '^id8.Observer', function() {
	function addObservers( observers ) {
		observers = m8.copy( m8.obj(), observers );
		var ctx = observers[_ctx], k, l, o, opt = observers[_options], s;
		Object.remove( observers, _ctx, _options );

		for ( k in observers ) {
			l = observers[k];
			o = l[_options] === U ? l[_options] : opt;
			s = l[_ctx]     === U ? l[_ctx]     : ctx;

			switch ( m8.nativeType( l ) ) {
				case 'function' : this.observe( k, l, ctx, opt );                                              break;
				case 'object'   : switch( m8.nativeType( l[_fn] ) ) {
					case 'function' : case 'object' : this.observe( k, l[_fn], s, o );                         break;
					case 'array'    : l[_fn].forEach( function( fn ) { this.observe( k, fn, s, o ); }, this ); break;
				} break;
				case 'array'    : l.forEach( function( fn ) { this.observe( k, fn, ctx, opt ); }, this );      break;
			}
		}
		return this;
	}

	function broadcast( cb ) {
		var args = this.args.concat( cb[_options].args ),
			ctx  = cb[_ctx] || this[_ctx],
			fire = cb.fire  || cb[_fn];

		if ( !m8.nativeType( fire ) == 'function' ) return true;

		if ( !!Object.key( this[_ctx], cb[_fn] ) )                     // if the original callback function is a method on this Observer
			args[0] !== this[_ctx] || args.shift();                    // then if the first argument is the Observer Object.remove it, as it's an internal event listener
		else if ( args[0] !== this[_ctx] ) args.unshift( this[_ctx] ); // otherwise, if the Observer is not the first argument, then add it, so the callback knows what Observer fired it

		return ( fire.apply( ctx, args ) !== false );                  // if a callback explicitly returns false, then we want to stop broadcasting
	}

	function createRelayCallback( ctxr, ctx, evt ) {
		return function Observer_relayedCallback() {
			var args = Array.coerce( arguments );
			!( args[0] === ctxr ) || args.shift(); // switch the context to the object relaying the event instead of the object that relayed it
			args.unshift( evt, ctx );
			return relay.apply( ctx, args );
		};
	}

// the reason we do this instead of passing { times : 1 } to Function.prototype.callback, is that we want to remove
// the callback from the observers queue after being fired once, rather than keeping it in the queue.
	function createSingleCallback( event, cb ) {
		var ctx = this;
		return ( cb.fire = function Observer_singleCallback() {
			ctx.ignore( event, cb[_fn], cb[_ctx] );
			if ( cb.fired ) return;
			cb.fired = true;
			return cb[_fn].apply( cb[_ctx] || ctx, arguments );
		} );
	}

	function find( e, o ) {
		var i = -1, l = e.length;
		while ( ++i < l ) if ( matchCallback( o, e[i] ) ) return e[i];
		return null;
	}


	function getObserver( r, v, k ) {
		var m;
		return ( k === this || ( m8.nativeType( m = this.match( k ) ) == 'array' && m[0] === this ) ) ? r.concat( v ) : r;
	}
	function getObservers( o, e )   { return o[_observers].aggregate( [], getObserver, e ); }

	function handleEvent( cb ) {
		return function handleEvent() { return cb.handleEvent.apply( cb, arguments ); }.mimic( cb.fire );
	}

	function matchCallback( o, cb ) {
		return ( o.isCB === true ? cb[_fn].valueOf() === o[_ctx].fire : cb[_fn] === o[_fn] ) && cb[_ctx] === o[_ctx] && cb.event === o.event;
	}

	function relay() { return this.broadcast.apply( this, arguments ); }

	function wildCardEsc( e ) { return e.replace( re_wc, '.*' ); }

	var _broadcasting = 'broadcasting',      _ctx         = 'ctx',
		_destroyed    = 'destroyed',         _fn          = 'fn',
		_observers    = 'listeners',         _options     = 'options',
		_suspended    = 'observer_suspended', listener_id = 0,
		 re_wc        = /\*/g;

	return {
		constructor    : function Observer( observers ) {
			this[_broadcasting] = false; this[_destroyed] = false;
			this[_suspended]    = false; this[_observers] = id8.Hash();

			m8.nativeType( observers )      != 'object' || this.observe( observers );
			m8.nativeType( this.observers ) != 'object' || this.observe( this.observers ), delete this.observers;
		},
		module         : id8,

// public methods
		broadcast      : function( event ) {
			if ( this[_destroyed] || this[_suspended] || !this[_observers].length || !event ) return;

			var args = Array.coerce( arguments, 1 ),
				e    = getObservers( this, event ); // this[_observers].get( event ).slice(); // slice: so we can add/ remove observers while this event is firing without disrupting the queue;

			if ( !e.length ) return; // if no event listeners, then don't worry

			this[_broadcasting] = event;

// if a callback returns false then we want to stop broadcasting, every will do this, forEach won't!
			e.every( broadcast, { args : args, ctx : this } );

			this[_broadcasting] = false;
		},
		buffer         : function( ms, evt, fn, ctx, o ) {
			m8.nativeType( o ) == 'object' || ( o = m8.obj() ); o.buffer = Number( ms );
			this.observe( evt, fn, ctx, o );
		},
		delay          : function( ms, evt, fn, ctx, o ) {
			m8.nativeType( o ) == 'object' || ( o = m8.obj() ); o.delay = Number( ms );
			this.observe( evt, fn, ctx, o );
		},
		destroy        : function() {
			if ( this[_destroyed] ) return true;
			if ( this.broadcast( 'before:destroy' ) === false ) return false;
			this[_destroyed] = true;
			this._destroy();
			this.broadcast( 'destroy' );
			this[_suspended] = true;
			delete this[_observers];
			return true;
		},
		ignore         : function( event, fn, ctx ) {
			event = wildCardEsc( event.toLowerCase() );
			var e = this[_observers].get( event ), i, o;

			if ( !e ) return;

			switch ( m8.type( fn ) ) {
				case 'id8_callback' : o = { ctx : fn,          isCB : true }; break;
				default             : o = { ctx : ctx || this, fn   : fn   };
			}
			o.event = event;
			o = find( e, o );
			if ( o !== null ) {
				i = e.indexOf( o );
				i < 0 || e.splice( i, 1 );
			}
		},
		observe        : function( event, fn, ctx, o ) {
			var cb, e = this[_observers], fnt, q;

			if ( m8.nativeType( event ) == 'object' ) return addObservers.call( this, event );
			switch ( ( fnt = m8.type( fn ) ) ) {
				case  'array' :
					cb = m8.obj(); cb[event] = { fn : fn, options : o, ctx : ctx };
					return addObservers.call( this, cb );
				case  'object' : case 'nullobject' : case 'id8_callback' : if ( 'handleEvent' in fn ) {
					!( m8.nativeType( ctx ) == 'object' && o === U ) || ( o = ctx );
					ctx = fn; fn = handleEvent( fn );
				} break;
				case 'string'  : !ctx || ( fn = ctx[fn] ); break;
			}

			event = wildCardEsc( event.toLowerCase() );
			( q = e.get( event ) ) || e.set( event, ( q = [] ) );

			switch( m8.nativeType( o ) ) {
				case 'boolean' : o = { single : !!o };       break;
				case 'number'  : o = { delay  :   o };       break;
				case 'object'  : o = m8.copy( m8.obj(), o ); break;
				default        : o = m8.obj();
			}

			Array.isArray( o.args ) || ( o.args = [] );

			cb      = { ctx : ctx || this, event : event, fn : fn, id : ++listener_id, options : o };
			cb.fire = ( o.single ? createSingleCallback.call( this, event, cb ) : cb[_fn] ).callback( {
				args : o.args, buffer : o.buffer, ctx : cb[_ctx], delay : o.delay
			} );
			q.push( cb );
		},
		once           : function( evt, fn, ctx, o ) {
			m8.nativeType( o ) == 'object' || ( o = m8.obj() );
			o.single = true;
			this.observe( evt, fn, ctx, o );
		},
		purgeObservers : function( event ) {
			var e = this[_observers];
			if ( !event ) { e.clear(); return; }
			event = event.toLowerCase();
			!e.has( event ) || e.set( event, [] );
		},
		relayEvents    : function( o ) {
			var e = Array.coerce( arguments, 1 ), evt;
			while ( evt = e.shift() )
				this.observe( evt, createRelayCallback( this, o, evt ), o );
		},
		resumeEvents   : function() { !this[_suspended] || ( this[_suspended] = false, this.broadcast( 'observer:resumed'   ) ); },
		suspendEvents  : function() {  this[_suspended] || ( this[_suspended] = true,  this.broadcast( 'observer:suspended' ) ); },

// internal methods
		_destroy       : m8.noop
	};
}() );
