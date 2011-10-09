# node-fnqueue ![project status](http://dl.dropbox.com/u/2208502/maintained.png)

A powerful utility for function chaining (inspired by [async](https://github.com/caolan/async)).

## Dependencies

- nodejs v0.4.12+

## Installation and first run

    $ git clone git://github.com/kilian/node-fnqueue.git

## Usage

Parameters:

- Object of functions
- Global callback
- Concurrency level (default is max possible)

Each field of first parameter (Functions object) must be an Array / Function.

If you pass an Array you are declaring a needed dependency with another function, otherwise you are passing a Function, then you are declaring a dependency less step.

Each function with a dependency is called with the result of the depended function as parameter.

The global callback is called on the first error, or at the end of all functions. The first parameter is the err (if provided) and the second one is a data object with the result of the chain.

FnQueue magically resolves all dependencies and executes functions in the right order with the provided concurrency level.

```javascript
var FnQueue = require('node-fnqueue');
```
or for a verbose mode:

```javascript
var FnQueue = require('node-fnqueue').verbose();
```
Example:

```javascript
new FnQueue({
    funnyStuff: ['processSomething', 'searchSomething', function(time, searchResults, callback){
        // do something silly
        callback(null, 'ciao!');
    }],
    searchSomething: function(callback){
        // do something with database
        callback(err, results);
    },
    update: ['searchSomething', function(searchResults, callback){
        // change values inside results and save to db
        callback(err); // no needs to return values
    }],
    processSomething: ['searchSomething', function(searchResults, callback){
        var start = new Date().getTime();
        // write a file log
        var elapsedTime = new Date().getTime() - start;
        callback(err, elapsedTime); // logs write time;
    }]
},function(err, data){

    if(err)
        throw err;

    console.log(data.searchSomething);  // results
    console.log(data.update);           // undefined
    console.log(data.processSomething); // elapsedTime
    console.log(data.funnyStuff);       // 'ciao!'
}, 1);
```
## License

_This software is released under the MIT license cited below_.

    Copyright (c) 2010 Kilian Ciuffolo, me@nailik.org. All Rights Reserved.

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the 'Software'), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.