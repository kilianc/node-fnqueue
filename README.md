# node-fnqueue ![project status](http://dl.dropbox.com/u/2208502/maintained.png)

A powerful utility for function chaining (inspired by [async](https://github.com/caolan/async)).

## Engine

- nodejs v0.4.12+ (tested with v0.6.x)

## Installation with npm

    $ npm install fnqueue

## Syntax

```javascript
new FnQueue(functionsList[, callback, concurrencyLevel, isStopped]);
```
##Parameters

1. `functionsList` __(Object)__ a list of Functions. Each function can declare implicit dependencies as arguments and assume you provide a single callback as the last argument.
2. `callback` __(Function(err, data))__ the complete callback in the conventional form of `function (err, data) { ... }`
3. `concurrencyLevel` __(Number/String: defaults to 'auto')__ the concurrency level of the chain execution, can be `'auto'` or `N* = { 1, 2, ... }`
4. `isStopped` __(Boolean: defaults to false)__ if true you must call the start method in order to execute the function list.

##Methods

* __start__: will start the execution, used in combination with `isStopped = true` constructor parameter

##Attributes

* __isVerbose__ _(Boolean)_: will change the instance verbose mode

##Notes

FnQueue runs a list of functions, each passing their results to the dependent function in the list. However, if any of the functions pass an error to the callback, the next function is not executed and the main callback is immediately called with the error.

Each dependency/argument must be named with the label of the dependent function in the `functionsList` (the first constructor argument).
Each function with a dependency will be called with the result of the dependent function as expected. __(YES this is a fucking cool introspection!)__

The global callback is called once, on the first error or at the end of the execution. A data object will be provided with the indexed result of the functions.

FnQueue magically resolves all dependencies and executes functions in the right order with the provided concurrency level.

##Example

```javascript
var FnQueue = require('fnqueue');
```
or for a verbose mode:

```javascript
var FnQueue = require('fnqueue').verbose();
```
Example:

```javascript
new FnQueue({
  // this will wait for 'processSomething' and 'searchSomething' and will be called with the respective results
  funnyStuff: function (processSomething, searchSomething, callback) {
    // do something silly
    callback(null, 'ciao!');
  },
  // this will be called instantly
  searchSomething: function (callback) {
    // do something with database
    callback(err, results);
  },
  // this will wait 'searchSomething'
  update: function (searchSomething, callback) {
    // change values inside results and save to db
    callback(err); // no needs to return values
  },
  // this will wait 'searchSomething'
  processSomething: function (searchSomething, callback) {
    var start = new Date().getTime();
    // do something slow
    var elapsedTime = new Date().getTime() - start;
    callback(err, elapsedTime);
  }]
}, function (err, data) {

  if (err) {
    throw err;
  }

  console.log(data.searchSomething);  // results
  console.log(data.update);           // undefined
  console.log(data.processSomething); // elapsedTime
  console.log(data.funnyStuff);       // 'ciao!'
}, 1);
```

##Introspection profiling results

Profiling results are pretty good, Function.toString() took up __2~ seconds__ every __1 Million__ of executions.

    Lines of code 		time (ms)		Platform
    ---------------------------------------------------------------------------------------------------
    800					1808ms			OSX Lion 2.2 GHz Intel Core i7 / nodejs v6.0.1

## Test

Tests depends on http://vowsjs.org/ then

    npm install -g vows
    npm install
    npm test

![tests](http://f.cl.ly/items/3q2W11392o2G2r0d0413/fnqueue_test_v2.0.1.png)

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