// store a reference to m8 in id8 so we can do fun stuff in commonjs modules without having to re-request m8 as well as id8 each time.
	util.def( __lib__, util.__name__, util.describe( { value : util }, 'r' ) );
// expose id8
	util.ENV != 'commonjs' ? util.def( util.global, Name, util.describe( { value : __lib__ }, 'r' ) ) : ( module.exports = __lib__ );
