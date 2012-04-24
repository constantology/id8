id8.Class( '^id8.Callback', function() {
	function buffer() {
		if ( bid in this ) return this;
		this[bid] = setTimeout( buffer_stop.bind( this ), this.buffer );
		return this.exec.apply( this, arguments );
	}
	function buffer_stop() { clearTimeout( this[bid] ); delete this[bid]; }
	function eventType( t ) { return t.indexOf( 'event' ) + 5 === t.length; }
	function handleEvent() { return this.fire.apply( this, arguments ); }

	var bid = 'bufferId', tid = 'timeoutId';

	return {
		constructor : function Callback( fn, conf ) {
			m8.copy( this, conf || {} );

			var desc = m8.describe( null, 'w' ),
				fire = ( m8.type( this.buffer ) == 'number' ? buffer : this.exec ).bind( this );

			desc.value = fn;   m8.def( this, 'fn',   desc );
			desc.value = this; m8.def( fire, 'cb',   desc );
			desc.value = fire; m8.def( this, 'fire', desc );

			this.args || ( this.args = [] );
			this.ctx  || ( this.ctx  = this );
			m8.type( this.delay ) == 'number' || ( this.delay = null );
			m8.type( this.times ) == 'number' && this.times > 0 || ( this.times = 0 );

			this.enable();
		},
		chain       : true,
		module      : id8,
// properties
		buffer      : null, count : 0,
		delay       : null, times : 0,
// methods
		disable     : function() {
			this.disabled    = true;
			this.handleEvent = m8.noop;
		},
		enable      : function() {
			this.disabled    = false;
			this.handleEvent = handleEvent;
		},
		exec        : function() {
			if ( this.disabled ) return;
			this.times === 0 || this.times > ++this.count || this.disable();

			var a  = Array.coerce( arguments ), me = this, ctx = me.ctx,
				ms = me.delay, t = m8.type( a[0] ), v;

			( t && ( eventType( t ) || t == 'id8_observer' ) )
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
		stop        : function() { !( tid in this ) || clearTimeout( this[tid] ), delete this[tid]; }
	};
}() );
