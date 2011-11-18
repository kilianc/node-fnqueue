function FnQueue(tasks, callback, concurrecyLevel, isStopped) {
  this.tasks = tasks;
  this.taskDependencies = {};
  this.callback = callback;
  this.callSequence = [];
  this.results = {};
  this.gotError = false;
  this.concurrecyLevel = concurrecyLevel || 'auto';
  this.runningNb = 0;
  this.loadDependencies();
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
      this.onTaskComplete(null, new Error('Invalid Function in chain: ' + taskName + ' is not a function'));
      return;
    }

    if (this.tasks[taskName].length === 0) {
      this.onTaskComplete(null, new Error('Invalid Function in chain: missing callback parameter in ' + taskName));
      return;
    }

    this.taskDependencies[taskName] = this.getFunctionArguments(this.tasks[taskName]).slice(0, -1);
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

FnQueue.prototype.getFunctionArguments = function (fn) {
  return (/^function.+\(([a-z0-9\n\r\t ,]*)\)/i).exec(fn.toString())[1].trim().split(/[ ,\n\r\t]+/);
};

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