__lib__.define( namespace( 'Callback' ), function() {
	function buffer() {
		if ( this[bid] ) return this;
		this[bid] = setTimeout( buffer_stop.bind( this ), this.buffer );
		return this.exec.apply( this, arguments );
	}
	function buffer_stop() { clearTimeout( this[bid] ); delete this[bid]; }
	function eventType( t ) { return t.indexOf( 'event' ) + 5 === t.length; }

	var bid = 'bufferId', tid = 'timeoutId';

	return {
		constructor : function Callback( fn, conf ) {
			util.copy( this, conf || {} );

			var fire = this.fire = this.handleEvent_ = ( util.type( this.buffer ) == 'number' ? buffer : this.exec ).bind( this );

			this.fn  = fn;
			fire.cb  = this;
			this.args || ( this.args = [] );
			this.ctx  || ( this.ctx  = this );

			if ( typeof this.delay != 'number' || isNaN( this.delay ) )
				this.delay = null;
			if ( typeof this.times != 'number' || isNaN( this.times ) || this.times < 0 )
				this.times = 0;

			this.enable();
		},
		extend      : Object,
		module      : __lib__,
// properties
		args        : null,
		buffer      : null,
		bufferId    : null,
		count       : 0,
		ctx         : null,
		delay       : null,
		timeoutId   : null,
		times       : 0,
// methods
		disable     : function() {
			this.disabled    = true;
			this.handleEvent = util.noop;
		},
		enable      : function() {
			this.disabled    = false;
			this.handleEvent = this.handleEvent_;
		},
		exec        : function() {
			if ( this.disabled ) return;
			this.times === 0 || this.times > ++this.count || this.disable();

			var a  = Array.coerce( arguments ), me = this, ctx = me.ctx,
				ms = me.delay, t = util.type( a[0] ), v;

			( t && ( eventType( t ) || t == Name + '-observer' ) )
			? a.splice.apply( a, [1, 0].concat( me.args ) )
			: a.unshift.apply( a, me.args );

			( ms === null
			? v = me.fn.apply( ctx, a )
			: me[tid] = setTimeout( function() { me.fn.apply( ctx, a ); }, ms ) );

			return v;
		},
		reset       : function() {
			this.count = 0;
			buffer_stop.call( this.enable() );
		},
		stop        : function() { !this[tid] || clearTimeout( this[tid] ), delete this[tid]; }
	};
}() );
