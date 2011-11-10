function FnQueue(tasks, callback, concurrecyLevel, stop){
	this.tasks = tasks;
	this.callback = callback;
	this.callSequence = [];
	this.results = {};
	this.gotError = false;
	this.concurrecyLevel = concurrecyLevel || 'auto';
	this.runningNb = 0;
	!stop && this.callNextFunction();
}

FnQueue.verbose = function(){
	FnQueue.prototype.isVerbose = true;
	return FnQueue;
};

FnQueue.prototype.isVerbose = false;

FnQueue.prototype.onTaskComplete = function(taskName, err, result){

	if(this.gotError)
		return;

	this.runningNb--;

	if(err){
		this.gotError = true;
		this.callback && this.callback(err, this.getResults());
		return;
	}

	this.results[taskName] = { result: result };
	this.callNextFunction();
};

FnQueue.prototype.getResults = function(){
	var results = {};
	for(var taskName in this.results)
		results[taskName] = this.results[taskName].result;
	return results;
};

FnQueue.prototype.callNextFunction = function(){

	var nextFunction, dependencies, finish = true, args;

	for(var taskName in this.tasks){

		if(this.concurrecyLevel != 'auto' && this.runningNb >= this.concurrecyLevel)
			return;

		dependencies = this.tasks[taskName];
		finish = false;

		// no dependecies declared then we are passing the next function
		if(dependencies instanceof Function){

			nextFunction = dependencies;
			this.isVerbose && console.log('FnQueue executing: ' + taskName);

			this.runningNb++;
			delete this.tasks[taskName];
			this.callSequence.push(taskName);

			// postpone next function to next tick,
			// will allow to close the current stack and keep the call order.
			process.nextTick(nextFunction.bind(this, this.onTaskComplete.bind(this, taskName)));

			continue;
		}

		args = this.getDependencies(dependencies);

		if(args){

			args.push(this.onTaskComplete.bind(this, taskName));

			this.isVerbose && console.log('FnQueue executing: ' + taskName);

			this.runningNb++;
			delete this.tasks[taskName];
			this.callSequence.push(taskName);
			nextFunction = dependencies.pop();
			nextFunction.apply(null, args);

			if(this.concurrecyLevel != 'auto' && this.runningNb >= this.concurrecyLevel)
				return;
		}
	}

	if(!finish && !nextFunction && !this.runningNb){
		dependencies.pop();
		this.onTaskComplete(null, new Error('Unresolvable dependencies: function "' + taskName + '" requires [' + dependencies.join(',') + ']'));
		return;
	}

	if(finish && !this.runningNb && this.callback){
		this.callback(null, this.getResults());
		this.destroy();
	}
};

FnQueue.prototype.start = FnQueue.prototype.callNextFunction;

FnQueue.prototype.getDependencies = function(dependencies){

	var args = [];

	for(var i = 0; i < dependencies.length-1; i++){

		if(this.results[dependencies[i]] === undefined){
			return false;
		}

		var arg = this.results[dependencies[i]];

		if(arg !== undefined)
			args.push(arg.result);
	}

	return args;
};

FnQueue.prototype.destroy = function(){
	delete this.results;
	delete this.callback;
	delete this.tasks;
};

module.exports = FnQueue;