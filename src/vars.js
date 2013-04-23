	var __chain__        = '__chain__',
		__classname__    = '__classname__',
		__config__       = '__config__',
		__guid__         = '__guid8__',
		__method__       = '__method__',
		__mixins__       = '__mixins__',
		__name__         = '__name__',
		__override__     = '__override__',
		__processing__   = '__processing__',
		__proto__        = '__proto__',
		__singleton__    = '__singleton__',
		__super__        = '__super__',
		__type__         = '__type__',
		UNDEF, Name_lc   = Name.toLowerCase(),
		anon_list        = Function.anon_list,
		internals        = util.obj(),
		re_invalid_chars = /[^A-Za-z0-9_\.$<>\[\]\{\}]/g,
		registered_alias = util.obj(),
		registered_path  = util.obj(),
		registered_type  = util.obj(),
		reserved_props   = [__chain__, __config__, __method__, __override__, __proto__, __type__, 'mixin', 'original', 'parent'].reduce( to_obj, util.obj() );

	internals.empty = { after : null, before : null, mixins : null };


