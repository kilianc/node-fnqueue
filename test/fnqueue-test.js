var
  vows = require('vows'),
  assert = require('assert'),
  FnQueue = require('../lib/fnqueue');

function returnsArguments(askedResults, exptectedResults) {
  return function (results) {
    assert.deepEqual(FnQueue.prototype.getDependencies.apply(results, [askedResults]), exptectedResults);
  };
}

vows.describe('FnQueue').addBatch({
  'When we require FnQueue': {
    topic: FnQueue.prototype,
    'FnQueue.verbose should be false by default': function (prototype) {
      assert.isFalse(prototype.isVerbose);
    }
  }
}).addBatch({
  'FnQueue.getFunctionArguments should success': {
    'without spaces': function () {
      assert.deepEqual(FnQueue.prototype.getFunctionArguments(function (foo,bar,callback) {}), ['foo', 'bar', 'callback']);
    },
    'with spaces': function () {
      assert.deepEqual(FnQueue.prototype.getFunctionArguments(function ( foo , bar , callback ) { }), ['foo', 'bar', 'callback']);
    },
    'with newline': function () {
      assert.deepEqual(FnQueue.prototype.getFunctionArguments(function (
        foo,
        bar,
        callback
      ) {//foo bar
        //foo bar
        var a = 5;
        for(var b = 0; b < 1000; b ++) { }
        if (a == 5) { }
      }), ['foo', 'bar', 'callback']);
    }
  }
}).addBatch({
  'Given an object of results': {
    topic: {
      results: {
        foo1: { result: 'foo1-result' },
        bar1: { result: 'bar1-result' },
        foo2: { result: 'foo2-result' },
        bar2: { result: 'bar2-result' }
      }
    },
    'FnQueue.getDependencies should return': {
      'foo1-result, bar1-result': returnsArguments(['foo1', 'bar1'], ['foo1-result', 'bar1-result']),
      'bar2-result, foo1-result, foo1-result': returnsArguments(['bar2', 'foo1', 'foo1'], ['bar2-result', 'foo1-result', 'foo1-result']),
      'false': returnsArguments(['foo1', 'bar1', 'youShouldNotFindMe'], false),
    },
    'FnQueue.getResults should return': {
      '{ foo1: "foo1-result", bar1: "bar1-result", foo2: "foo2-result", bar2: "bar2-result" }': function (result) {
        assert.deepEqual(FnQueue.prototype.getResults.apply(result), { foo1: "foo1-result", bar1: "bar1-result", foo2: "foo2-result", bar2: "bar2-result" });
      }
    }
  },
  'Given an empty object of results': {
    topic: { results: {} },
    'FnQueue.getDependencies should return': {
      'false for [foo1, bar1]': returnsArguments(['foo1', 'bar1'], false),
      'false for [bar2, foo1]': returnsArguments(['bar2', 'foo1', 'foo1'], false),
      'false for [foo1, bar1, youShouldnotFindMe]': returnsArguments(['foo1', 'bar1', 'youShouldNotFindMe'], false),
    },
    'FnQueue.getResults should return': {
      '{}': function (result) {
        assert.deepEqual(FnQueue.prototype.getResults.apply(result), {});
      }
    }
  },
  'FnQueue.destroy, given a dummy object': {
    topic: { results: {}, callback: {}, tasks: {} },
    'should delete results, callback and tasks properties': function (obj) {
      FnQueue.prototype.destroy.apply(obj);
      assert.isEmpty(obj);
    }
  },
  'FnQueue.loadDependencies, given a function queue': {
    topic: function () {
      var queue = new FnQueue({
        fn1: function (fn2, callback) {
          setTimeout(callback.bind(null, null, 'fn1'), 500);
        },
        fn2: function (fn4, callback) {
          setTimeout(callback.bind(null, null, 'fn2'), 500);
        },
        fn3: function (fn1, fn2, fn4, callback) {
          setTimeout(callback.bind(null, null, undefined), 500);
        },
        fn4: function (callback) {
          setTimeout(callback.bind(null, null, false), 500);
        }
      }, null, 1, true);
      return queue;
    },
    'should load dependencies correctly': function (queue) {
      assert.deepEqual(queue.taskDependencies, {
        fn1: ['fn2'],
        fn2: ['fn4'],
        fn3: ['fn1', 'fn2', 'fn4'],
        fn4: []
      });
    }
  },
  'FnQueue.loadDependencies, given a wrong function queue (missing callback)': {
    topic: function () {
      var queue = new FnQueue({
        fn1: function (fn2, callback) {
          setTimeout(callback.bind(null, null, 'fn1'), 500);
        },
        fn2: function (fn4, callback) {
          setTimeout(callback.bind(null, null, 'fn2'), 500);
        },
        fn3: function (fn1, fn2, fn4, callback) {
          setTimeout(callback.bind(null, null, undefined), 500);
        },
        fn4: function () {
          setTimeout(callback.bind(null, null, false), 500);
        }
      }, this.callback, 1, true);
    },
    'should call the main callback with an error': function (err, data) {
      assert.isNotNull(err);
    },
    'error should match the "Invalid Function in list..." messgae': function (err, data) {
      assert.match(err.message, /^Invalid Function in list/);
    }
  },
  'FnQueue.loadDependencies, given a wrong function queue (not a function)': {
    topic: function () {
      var queue = new FnQueue({
        fn1: function (fn2, callback) {
          setTimeout(callback.bind(null, null, 'fn1'), 500);
        },
        fn2: function (fn4, callback) {
          setTimeout(callback.bind(null, null, 'fn2'), 500);
        },
        fn3: function (fn1, fn2, fn4, callback) {
          setTimeout(callback.bind(null, null, undefined), 500);
        },
        fn4: 'ciao'
      }, this.callback, 1, true);
    },
    'should call the main callback with an error': function (err, data) {
      assert.isNotNull(err);
    },
    'error should match the "Invalid Function in list..." messgae': function (err, data) {
      assert.match(err.message, /^Invalid Function in list/);
    }
  },
  'FnQueue with an example queue of functions': {
    topic: function () {
      new FnQueue({
        fn1: function (callback) {
          setTimeout(callback.bind(null, null, 'fn1'), 500);
        },
        fn2: function (callback) {
          setTimeout(callback.bind(null, null, 'fn2'), 500);
        },
        fn3: function (callback) {
          setTimeout(callback.bind(null, null, undefined), 500);
        },
        fn4: function (callback) {
          setTimeout(callback.bind(null, null, false), 500);
        }
      }, this.callback);
    },
    'should not return error': function (err, data) {
      assert.isNull(err);
    },
    'data should be an Object': function (err, data) {
      assert.isObject(data);
    },
    'data should contains all the queue results': function (err, data) {
      assert.deepEqual(data,{
        fn1: 'fn1',
        fn2: 'fn2',
        fn3: undefined,
        fn4: false,
      });
    }
  },
  'FnQueue with a wrong concurrency level (< 0)': {
    topic: function () {
      new FnQueue({
        fn1: function (callback) {
          setTimeout(callback.bind(null, null, 'fn1'), 500);
        },
        fn2: function (callback) {
          setTimeout(callback.bind(null, null, 'fn2'), 500);
        },
        fn3: function (callback) {
          setTimeout(callback.bind(null, null, undefined), 500);
        },
        fn4: function (callback) {
          setTimeout(callback.bind(null, null, false), 500);
        }
      }, this.callback, -5);
    },
    'should call the main callback with an error': function (err, data) {
      assert.isNotNull(err);
    },
    'error should match the "Invalid Function in list..." messgae': function (err, data) {
      assert.match(err.message, /^Invalid concurrecyLevel/);
    }
  },
  'FnQueue with a wrong concurrency level (!== \'auto\')': {
    topic: function () {
      new FnQueue({
        fn1: function (callback) {
          setTimeout(callback.bind(null, null, 'fn1'), 500);
        },
        fn2: function (callback) {
          setTimeout(callback.bind(null, null, 'fn2'), 500);
        },
        fn3: function (callback) {
          setTimeout(callback.bind(null, null, undefined), 500);
        },
        fn4: function (callback) {
          setTimeout(callback.bind(null, null, false), 500);
        }
      }, this.callback, 'wrong!');
    },
    'should call the main callback with an error': function (err, data) {
      assert.isNotNull(err);
    },
    'error should match the "Invalid Function in list..." messgae': function (err, data) {
      assert.match(err.message, /^Invalid concurrecyLevel/);
    }
  },
  'FnQueue with some error throwing function': {
    topic: function () {
      new FnQueue({
        fn1: function (callback) {
          setTimeout(callback.bind(null, null, 'fn1'), 200);
        },
        fn2: function (callback) {
          setTimeout(callback.bind(null, new Error('This is thrown by fn2'), 'fn2'), 300);
        },
        fn3: function (callback) {
          setTimeout(callback.bind(null, new Error('This is thrown by fn3'), undefined), 200);
        },
        fn4: function (callback) {
          setTimeout(callback.bind(null, null, false), 200);
        }
      }, this.callback);
    },
    'should call the main callback with an error': function (err, data) {
      assert.isNotNull(err);
    },
    'error message should be "This is thrown by fn3"': function (err, data) {
      assert.equal(err.message, 'This is thrown by fn3');
    },
    'data should contains partial results': function (err, data) {
      assert.deepEqual(data, { fn1: 'fn1' });
    }
  }
}).addBatch({
  'FnQueue with unresolvable dependencies': {
    topic: function () {
      new FnQueue({
        fn1: function (fn2, fn4, fn3, callback) {
          setTimeout(callback.bind(null, null, 'fn1'), 100);
        },
        fn2: function (fn4, callback) {
          setTimeout(callback.bind(null, null, 'fn2'), 100);
        },
        fn3: function (fn2, fn1, callback) {
          setTimeout(callback.bind(null, null, undefined), 100);
        },
        fn4: function (callback) {
          setTimeout(callback.bind(null, null, false), 100);
        }
      }, this.callback);
    },
    'should call the main callback with an error': function (err, data) {
      assert.isNotNull(err);
    },
    'error should match the "Unresolvable dependencies..." messgae': function (err, data) {
      assert.match(err.message, /^Unresolvable dependencies/);
    },
    'data should contain partial results': function (err, data) {
      assert.deepEqual(data, { fn4: false, fn2: 'fn2' });
    }
  }
}).addBatch({
  'FnQueue with some dependencies': {
    topic: function () {
      new FnQueue({
        fn1: function (fn2, fn4, fn3, callback) {
          setTimeout(callback.bind(null, null, 'fn1'), 100);
        },
        fn2: function (fn4, callback) {
          setTimeout(callback.bind(null, null, 'fn2'), 100);
        },
        fn3: function (fn2, callback) {
          setTimeout(callback.bind(null, null, undefined), 100);
        },
        fn4: function (callback) {
          setTimeout(callback.bind(null, null, false), 100);
        }
      }, this.callback);
    },
    'should follow dependecies constrains in call sequence': function (err, data) {
      assert.deepEqual(this.callSequence, ['fn4', 'fn2', 'fn3', 'fn1']);
    }
  }
}).addBatch({
  'FnQueue with an example queue of functions and a concurrency level of 2': {
    topic: function () {

      var fnQueue = new FnQueue({
        fn1: function (callback) {
          setTimeout(getCallback(2, callback), 200);
        },
        fn2: function (fn9, callback) {
          setTimeout(getCallback(null, callback), 200);
        },
        fn3: function (fn9, fn8, callback) {
          setTimeout(getCallback(null, callback), 200);
        },
        fn4: function (callback) {
          setTimeout(getCallback(3, callback), 200);
        },
        fn5: function (callback) {
          setTimeout(getCallback(null, callback), 200);
        },
        fn6: function (callback) {
          setTimeout(getCallback(null, callback), 200);
        },
        fn7: function (callback) {
          setTimeout(getCallback(1, callback), 200);
        },
        fn8: function (callback) {
          setTimeout(getCallback(2, callback), 200);
        },
        fn9: function (fn7, fn8, callback) {
          setTimeout(getCallback(null, callback), 200);
        }
      }, this.callback, 1, true);

      fnQueue.concurrencySequence = [];

      function getCallback(concurrecyLevel, callback) {
        return function () {
          concurrecyLevel && (fnQueue.concurrecyLevel = concurrecyLevel);
          fnQueue.concurrencySequence.push(fnQueue.runningNb);
          callback(null, fnQueue.runningNb);
        };
      }

      fnQueue.start();
    },
    'should not return error': function (err, data) {
      assert.isNull(err);
    },
    'max concurrency should follow the expected concurrency sequence': function (err, data) {
      assert.deepEqual(this.concurrencySequence, [ 1, 2, 3, 3, 2, 1, 1, 2, 1 ]);
    },
  },
}).export(module);