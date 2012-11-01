# id8.js [![build status](https://secure.travis-ci.org/constantology/id8.png)](http://travis-ci.org/constantology/id8)

**id8** can be pronounced in one of two ways:

**ideate |ˈīdēˌāt|**
verb \[ with obj. \] (often as adj. **ideated**)
form an idea of; imagine or conceive: the arc whose ideated center is a nodal point in the composition.
• \[ no obj. \] form ideas; think.
ORIGIN late 17th cent.: from medieval Latin **ideat- ‘formed as an idea,’** from the verb **ideare**, from Latin **idea**.

This is the intended pronunciation, based on the functionality offered by **id8**'s API.

**idiot |ˈidēət|**
noun informal
a stupid person.
• Medicine, archaic a mentally handicapped person.
ORIGIN Middle English (denoting a person of low intelligence): via Old French from Latin **idiota ‘ignorant person,’** from Greek **idiōtēs ‘private person, layman, ignorant person,’** from idios **‘own, private.’**

Use this pronunciation if you're thinking, "why the hell is this **idiot** coming up with libraries whose names all contain the number **8**‽".

## Dependencies

id8.js only has one dependency [m8.js](/constantology/m8).

**NOTE:**
If you are using id8 within a commonjs module, you don't need to require m8 before requiring id8 as this is done internally and a reference to **m8** is available as: `id8.m8`.

```javascript

   var id8 = require( 'id8' ),
       m8  = id8.m8; // <= reference to m8

// if running in a sandboxed environment remember to:
   m8.x( Object, Array, Boolean, Function, String ); // and/ or any other Types that require extending.

```

See [m8: Extending into the future](/constantology/m8) for more information on working with sandboxed modules.

## Support

Tested to work with nodejs, FF4+, Safari 5+, Chrome 7+, IE9+. Should technically work in any browser that supports [ecma 5]( http://kangax.github.com/es5-compat-table/) without throwing any JavaScript errors.

## File size

- id8.js ≅ 8.4kb (gzipped)
- id8.min.js ≅ 4.8kb (minzipped)

## License

(The MIT License)

Copyright &copy; 2012 christos "constantology" constandinou http://muigui.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
