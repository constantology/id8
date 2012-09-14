	var __classname__    = '__classname__',
		__config__       = '__config__',
		__guid__         = '__guid__',
		__method__       = '__method__',
		__mixins__       = '__mixins__',
		__name__         = '__name__',
		__singleton__    = '__singleton__',
		__super__        = '__super__',
		__type__         = '__type__',
		Name_lc          = Name.toLowerCase(), U,
		anon_list        = Function.anon_list,
		internals        = util.obj(),
		re_invalid_chars = /[^A-Za-z0-9_\.]/g,
		registered_path  = util.obj(),
		registered_type  = util.obj();

	internals.empty = { after : null, before : null, mixins : null };
