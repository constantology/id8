// store a reference to m8 in id8 so we can do fun stuff in commonjs modules without having to re-request m8 as well as id8 each time.
	m8.def( id8, 'm8', m8.describe( { value : m8 }, 'r' ) );
// expose id8
	m8.ENV != 'commonjs' ? m8.def( m8.global, 'id8', m8.describe( { value : id8 }, 'r' ) ) : ( module.exports = id8 );
