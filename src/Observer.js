__lib__.define( namespace( 'Observer' ), function() {
	function addObservers( observers ) {
		observers = util.copy( util.obj(), observers );
		var ctx = observers.ctx, k, l, o, opt = observers.options, s;
		util.remove( observers, 'ctx', 'options' );

		for ( k in observers ) {
			l = observers[k];
			o = l.options === U ? l.options : opt;
			s = l.ctx     === U ? l.ctx     : ctx;

			switch ( util.nativeType( l ) ) {
				case 'function' : this.observe( k, l, ctx, opt );                                              break;
				case 'object'   : switch( util.nativeType( l.fn ) ) {
					case 'function' : case 'object' : this.observe( k, l.fn, s, o );                         break;
					case 'array'    : l.fn.forEach( function( fn ) { this.observe( k, fn, s, o ); }, this ); break;
				} break;
				case 'array'    : l.forEach( function( fn ) { this.observe( k, fn, ctx, opt ); }, this );      break;
			}
		}
		return this;
	}

	function broadcast( cb ) {
		var args = this.args.concat( cb.options.args ),
			ctx  = cb.ctx || this.ctx,
			fire = cb.fire  || cb.fn;

		if ( !is_fun( fire ) ) return true;

		if ( !!Object.key( this.ctx, cb.fn ) )        // if the original callback function is a method on this Observer
			args[0] !== this.ctx || args.shift();     // then if the first argument is the Observer util.remove it, as it's
		else if ( args[0] !== this.ctx )              // an internal event listener. otherwise, if the Observer is not the
			args.unshift( this.ctx );                 // first argument, then add it, so the callback knows what Observer fired it

		return ( fire.apply( ctx, args ) !== false ); // if a callback explicitly returns false, then we want to stop broadcasting
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
			ctx.ignore( event, cb.fn, cb.ctx );
			if ( cb.fired ) return;
			cb.fired = true;
			return cb.fn.apply( cb.ctx || ctx, arguments );
		} );
	}

	function find( e, o ) {
		var i = -1, l = e.length;
		while ( ++i < l ) if ( matchCallback( o, e[i] ) ) return e[i];
		return null;
	}


	function getObserver( r, v, k ) {
		var m;
		return ( k === this || ( Array.isArray( m = this.match( k ) ) && m[0] === this ) ) ? r.concat( v ) : r;
	}
	function getObservers( o, e )   { return o.listeners.aggregate( [], getObserver, e ); }

	function handleEvent( cb ) {
		return function handleEvent() { return cb.handleEvent.apply( cb, arguments ); }.mimic( cb.fire );
	}

	function matchCallback( o, cb ) {
		return ( o.isCB === true ? cb.fn.valueOf() === o.ctx.fire : cb.fn === o.fn ) && cb.ctx === o.ctx && cb.event === o.event;
	}

	function relay() { return this.broadcast.apply( this, arguments ); }

	function wildCardEsc( e ) { return e.replace( re_wc, '.*' ); }

	var listener_id = 0, re_wc = /\*/g;

	return {
		constructor    : function Observer( observers ) {
			this.broadcasting       = false; this.destroyed = false;
			this.observer_suspended = false; this.listeners = __lib__( 'Hash' );

			!is_obj( observers )      || this.observe( observers );
			!is_obj( this.observers ) || this.observe( this.observers ), delete this.observers;
		},
		module         : __lib__,

// public methods
		broadcast      : function( event ) {
			if ( this.destroyed || this.observer_suspended || !this.listeners.length || !event ) return;

			var args = Array.coerce( arguments, 1 ),
				e    = getObservers( this, event ); // this.listeners.get( event ).slice(); // slice: so we can add/ remove observers while this event is firing without disrupting the queue;

			if ( !e.length ) return; // if no event listeners, then don't worry

			this.broadcasting = event;

// if a callback returns false then we want to stop broadcasting, every will do this, forEach won't!
			e.every( broadcast, { args : args, ctx : this } );

			this.broadcasting = false;
		},
		buffer         : function( ms, evt, fn, ctx, o ) {
			is_obj( o ) || ( o = util.obj() ); o.buffer = Number( ms );
			this.observe( evt, fn, ctx, o );
		},
		delay          : function( ms, evt, fn, ctx, o ) {
			is_obj( o ) || ( o = util.obj() ); o.delay = Number( ms );
			this.observe( evt, fn, ctx, o );
		},
		destroy        : function() {
			if ( this.destroyed ) return true;
			if ( this.broadcast( 'before:destroy' ) === false ) return false;
			this.destroyed = true;
			this._destroy();
			this.broadcast( 'destroy' );
			this.observer_suspended = true;
			delete this.listeners;
			return true;
		},
		ignore         : function( event, fn, ctx ) {
			event = wildCardEsc( event.toLowerCase() );
			var e = this.listeners.get( event ), i, o;

			if ( !e ) return;

			switch ( util.type( fn ) ) {
				case ( Name + '-callback' ) : o = { ctx : fn,          isCB : true }; break;
				default                     : o = { ctx : ctx || this, fn   : fn   };
			}
			o.event = event;
			o = find( e, o );
			if ( o !== null ) {
				i = e.indexOf( o );
				i < 0 || e.splice( i, 1 );
			}
		},
		observe        : function( event, fn, ctx, o ) {
			var cb, e = this.listeners, fnt, q;

			if ( is_obj( event ) ) return addObservers.call( this, event );
			switch ( ( fnt = util.type( fn ) ) ) {
				case  'array' :
					cb = util.obj(); cb[event] = { fn : fn, options : o, ctx : ctx };
					return addObservers.call( this, cb );
				case  'object' : case 'nullobject' : case ( Name + '-callback' ) : if ( 'handleEvent' in fn ) {
					!( is_obj( ctx ) && o === U ) || ( o = ctx );
					ctx = fn; fn = handleEvent( fn );
				} break;
				case 'string'  : !ctx || ( fn = ctx[fn] ); break;
			}

			event = wildCardEsc( event.toLowerCase() );
			( q = e.get( event ) ) || e.set( event, ( q = [] ) );

			switch( util.nativeType( o ) ) {
				case 'boolean' : o = { single : !!o };       break;
				case 'number'  : o = { delay  :   o };       break;
				case 'object'  : o = util.copy( util.obj(), o ); break;
				default        : o = util.obj();
			}

			Array.isArray( o.args ) || ( o.args = [] );

			cb      = { ctx : ctx || this, event : event, fn : fn, id : ++listener_id, options : o };
			cb.fire = ( o.single ? createSingleCallback.call( this, event, cb ) : cb.fn ).callback( {
				args : o.args, buffer : o.buffer, ctx : cb.ctx, delay : o.delay
			} );
			q.push( cb );
		},
		once           : function( evt, fn, ctx, o ) {
			is_obj( o ) || ( o = util.obj() );
			o.single = true;
			this.observe( evt, fn, ctx, o );
		},
		purgeObservers : function( event ) {
			var e = this.listeners;
			if ( !event ) { e.clear(); return; }
			event = event.toLowerCase();
			!e.has( event ) || e.set( event, [] );
		},
		relayEvents    : function( o ) {
			var e = Array.coerce( arguments, 1 ), evt;
			while ( evt = e.shift() )
				this.observe( evt, createRelayCallback( this, o, evt ), o );
		},
		resumeEvents   : function() { !this.observer_suspended || ( this.observer_suspended = false, this.broadcast( 'observer:resumed'   ) ); },
		suspendEvents  : function() {  this.observer_suspended || ( this.observer_suspended = true,  this.broadcast( 'observer:suspended' ) ); },

// internal methods
		_destroy       : util.noop
	};
}() );
