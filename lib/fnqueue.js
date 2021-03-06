var
  introspect = require('introspect');

function FnQueue(tasks, callback, concurrecyLevel, isStopped) {
  this.tasks = tasks;
  this.taskDependencies = Object.create(null);
  this.callback = callback;
  this.callSequence = [];
  this.results = Object.create(null);
  this.gotError = false;
  this.concurrecyLevel = concurrecyLevel || 'auto';
  this.runningNb = 0;
  this.loadDependencies();

  if (typeof this.concurrecyLevel !== 'string' && typeof this.concurrecyLevel !== 'number') {
    this.onTaskComplete(null, new Error('Invalid concurrecyLevel: ' + typeof this.concurrecyLevel + ', must be a Number or \'auto\''));
    return;
  } else if (typeof this.concurrecyLevel === 'number' && this.concurrecyLevel < 1) {
    this.onTaskComplete(null, new Error('Invalid concurrecyLevel: ' + this.concurrecyLevel + ' < 1'));
    return;
  } else if (typeof this.concurrecyLevel === 'string' && this.concurrecyLevel !== 'auto') {
    this.onTaskComplete(null, new Error('Invalid concurrecyLevel: ' + this.concurrecyLevel + ' < 1'));
    return;
  }

  !isStopped && this.callNextFunction();
}

FnQueue.verbose = function () {
  FnQueue.prototype.isVerbose = true;
  return FnQueue;
};

FnQueue.prototype.isVerbose = false;

FnQueue.prototype.loadDependencies = function() {

  for(var taskName in this.tasks) {

    if (typeof this.tasks[taskName] !== 'function') {
      this.onTaskComplete(null, new Error('Invalid Function in list: ' + taskName + ' is not a function'));
      return;
    }

    if (this.tasks[taskName].length === 0) {
      this.onTaskComplete(null, new Error('Invalid Function in list: missing callback parameter in ' + taskName));
      return;
    }

    this.taskDependencies[taskName] = introspect(this.tasks[taskName]).slice(0, -1);
  }
};

FnQueue.prototype.onTaskComplete = function (taskName, err, result) {

  if (this.gotError) {
    return; 
  }

  this.runningNb--;

  if (err) {
    this.gotError = true;
    this.callback && this.callback(err, this.getResults());
    return;
  }

  this.results[taskName] = { result: result };
  this.callNextFunction();
};

FnQueue.prototype.getResults = function () {
  var results = {};
  for(var taskName in this.results) {
    results[taskName] = this.results[taskName].result;
  }
  return results;
};

FnQueue.prototype.callNextFunction = function () {

  var nextFunction, dependencies, finish = true, args;

  for(var taskName in this.tasks) {

    finish = false;

    if (this.concurrecyLevel != 'auto' && this.runningNb >= this.concurrecyLevel) {
      return;
    }

    nextFunction = this.tasks[taskName];
    dependencies = this.taskDependencies[taskName];
    args = this.getDependencies(dependencies);

    if (args) {
      args.push(this.onTaskComplete.bind(this, taskName));

      this.isVerbose && console.log('  - FnQueue: executing: ' + taskName + '(' + dependencies.join(',') + ') { ... }');

      this.runningNb++;
      delete this.tasks[taskName];
      this.callSequence.push(taskName);
      nextFunction.apply(null, args);

      if (this.concurrecyLevel != 'auto' && this.runningNb >= this.concurrecyLevel) {
        return;
      }
    }
  }

  if (!finish && this.runningNb === 0) {
    this.onTaskComplete(null, new Error('Unresolvable dependencies: function "' + taskName + '" requires [' + dependencies.join(',') + ']'));
    return;
  }

  if (finish && !this.runningNb && this.callback) {
    this.callback(null, this.getResults());
    this.destroy();
  }
};

FnQueue.prototype.start = FnQueue.prototype.callNextFunction;

FnQueue.prototype.getDependencies = function (dependencies) {

  var args = [];

  for(var i = 0; i < dependencies.length; i++) {

    if (this.results[dependencies[i]] === undefined) {
      return false;
    }

    var arg = this.results[dependencies[i]];

    if (arg !== undefined) {
      args.push(arg.result);
    }
  }

  return args;
};

FnQueue.prototype.destroy = function () {
  delete this.results;
  delete this.callback;
  delete this.tasks;
};

module.exports = FnQueue;