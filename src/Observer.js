__lib__.define( namespace( 'Observer' ), function() {
	function broadcast( args, cb ) {
		if ( !is_fun( cb.handleEvent ) ) return true;

		args = args.slice( 0 );

		if ( !!Object.key( this, cb.fn ) )                         // if the original callback function is a method on this Observer
			args[0] !== this || args.shift();                      // then if the first argument is the Observer remove it, as it's
		else if ( args[0] !== this )                               // an internal event listener. otherwise, if the Observer is not the
			args.unshift( this );                                  // first argument, then add it, so the callback has reference to
																   // which Observer fired the event
		return ( cb.handleEvent.apply( cb.ctx, args ) !== false ); // if a callback explicitly returns false, then we want to stop broadcasting
	}

	function createCallback( fn, config ) {
		return __lib__( 'callback', fn, config );
	}

	function createCallbackConfig( config, ctx ) {
		switch( util.nativeType( config ) ) {
			case 'boolean' : config = { times : !!config ? 1 : 0 };     break;
			case 'number'  : config = { delay :   config };             break;
			case 'object'  : config = util.merge( util.obj(), config ); break;
			default        : config = util.obj();
		}

		if ( util.got( config, 'single' ) ) {
			config.times = !!config.single ? 1 : 0;
			delete config.single;
		}

		if ( !Array.isArray( config.args ) )
			config.args = [];

		config.ctx = ctx;

		return config;
	}

	function createRelayCallback( ctxr, ctx, evt ) {
		return function Observer_relayedCallback() {
			var args = Array.coerce( arguments );
			!( args[0] === ctxr ) || args.shift(); // switch the context to the object relaying the event instead of the object that relayed it
			args.unshift( evt, ctx );
			return relay.apply( ctx, args );
		};
	}

	function findIndex( observer, queue, fn, ctx ) {
		var cb, i = -1; ctx || ( ctx = observer );

		while ( cb = queue[++i] ) {
			if ( cb === fn || ( cb.fn === fn && cb.ctx === ctx ) ) {
				return i;
			}
		}
		return null;
	}

	function getListener( listeners, queue, event ) {
		var firing_event = String( this ), match;

		if ( event === firing_event )
			listeners.push.apply( listeners, queue );
		else {
			match = firing_event.match( event );
			if ( Array.isArray( match ) && match[0] === firing_event )
				listeners.push.apply( listeners, queue );
		}

		return listeners;
	}
	function getListeners( observer, event ) {
		return observer.listeners.aggregate( [], getListener, event );
	}

	function handleEvent( cb ) {
		return function handleEvent() {
			return is_fun( cb.handleEvent ) ? cb.handleEvent.apply( cb, arguments ) : U;
		};
	}

	function observe( observer, listeners ) {
		listeners = util.copy( util.obj(), listeners );

		if ( !listeners.ctx )
			listeners.ctx = observer;

		if ( util.got( listeners, 'options' ) )
			listeners.options = createCallbackConfig( listeners.options );

		return Object.reduce( listeners, observe_type, observer );
	}

	function observe_multi( event, ctx, options ) {
		return function _observe( fn ) {
			this.observe( event, fn, ctx, options );
		};
	}

	function observe_type( observer, listener, event, listeners, index ) {
		if ( event == 'ctx' || event == 'options' )
			return observer;

		var ctx, fn, options, type = util.type( listener );

		switch ( type ) {
			case type_callback :
				fn  = listener;
				break;

			case 'function'    : case 'array'  : case 'string' :
				ctx = listeners.ctx;
				fn  = listener;
				break;

			case 'nullobject'  : case 'object' :
				ctx     = listener.ctx || listeners.ctx;
				fn      = listener.fn;
				options = util.got( listener, 'options' ) ? createCallbackConfig( listener.options ) : listeners.options;
				break;
		}

		observer.observe( event, fn, ctx, options );

		return observer;
	}

	function relay() { return this.broadcast.apply( this, arguments ); }

	function wildCardEsc( evt ) { return String( evt ).toLowerCase().replace( re_wc, '.*' ); }

	var re_wc = /\*/g, type_callback = Name + '-callback';

	return {
		constructor        : function Observer( observers ) {
			this.listeners = __lib__( 'Hash' );

			!is_obj( observers ) || this.observe( observers );
		},
		extend             : Object,
		module             : __lib__,

// public properties
		broadcasting       : false,
		destroyed          : false,
		destroying         : false,
		observer_suspended : false,

// public methods
		broadcast          : function( event ) {
			if ( this.destroyed || this.observer_suspended || !this.listeners.length || !event ) return;

			var queue = getListeners( this, event ); // in any case will return a different array to the queue to ensure
													 // any listeners added or removed during broadcast don't affect the
													 // current broadcast

			if ( !queue.length ) return; 			 // if no event queue, then don't even bother

			this.broadcasting = event;

// if a callback returns false then we want to stop broadcasting, every will do this, forEach won't!
			queue.every( broadcast.bind( this, Array.coerce( arguments, 1 ) ) );

			this.broadcasting = false;
		},
		buffer             : function( ms, evt, fn, ctx, options ) {
			is_obj( options ) || ( options = util.obj() ); options.buffer = Number( ms );
			this.observe( evt, fn, ctx, options );
		},
		delay              : function( ms, evt, fn, ctx, options ) {
			is_obj( options ) || ( options = util.obj() ); options.delay = Number( ms );
			this.observe( evt, fn, ctx, options );
		},
		destroy            : function() {
			if ( this.destroyed ) return true;
			if ( this.broadcast( 'before:destroy' ) === false ) return false;
			this.destroying = true;
			this._destroy().onDestroy();
			this.destroying = false;
			this.destroyed  = true;
			this.broadcast( 'destroy' );
			this.observer_suspended = true;
			delete this.listeners;
			return true;
		},
		ignore             : function( event, fn, ctx ) {
			event = wildCardEsc( event.toLowerCase() );

			var queue = this.listeners.get( event ), i, o;

			if ( !Array.isArray( queue ) || !queue.length ) return;

			var index = findIndex( this, queue, fn, ctx );

			!~index || queue.splice( index, 1 );
		},
		observe            : function( event, fn, ctx, options ) {
			if ( is_obj( event ) )
				return observe( this, event );

			event = wildCardEsc( String( event ).toLowerCase() );

			var queue = this.listeners.get( event ),
				type  = util.type( fn );

			Array.isArray( queue ) || this.listeners.set( event, ( queue = [] ) );

			switch ( type ) {
				case type_callback :
					queue.push( fn );
					break;

				case 'array'       :
					fn.map( observe_multi( event, ctx, options ), this );
					break;

				default            : switch( type ) {
					case 'object'     :
					case 'nullobject' : if ( util.has( fn, 'handleEvent' ) ) {
						if ( is_obj( ctx ) && options === U )
							options = ctx;
						ctx = fn;
						fn  = handleEvent( fn );
					}      break;

					case 'string'     : if ( is_obj( ctx ) ) {
						fn = ctx[fn];
					}      break;
				}
				queue.push( createCallback( fn, createCallbackConfig( options, ctx || this ) ) );
			}
		},
		once               : function( evt, fn, ctx, options ) {
			is_obj( options ) || ( options = util.obj() );
			options.single = true;
			this.observe( evt, fn, ctx, options );
		},
		purgeObservers     : function( event ) {
			event ? this.listeners.set( wildCardEsc( event ), [] ) : this.listeners.clear();
		},
		relayEvents        : function( target_observer ) {
			var e = Array.coerce( arguments, 1 ), evt;
			while ( evt = e.shift() )
				this.observe( evt, createRelayCallback( this, target_observer, evt ), target_observer );
		},
		resumeEvents       : function() {
			if ( !this.observer_suspended ) return;

			this.observer_suspended = false;
			this.broadcast( 'observer:resumed' );
		},
		suspendEvents      : function() {
			if ( this.observer_suspended ) return;

			this.broadcast( 'observer:suspended' );
			this.observer_suspended = true;
		},

// internal methods
		_destroy       : util.noop,
		onDestroy      : util.noop
	};
}() );
