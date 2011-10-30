function FnQueue(tasks, callback, concurrecyLevel){
	this.tasks = tasks;
	this.callback = callback;
	this.results = {};
	this.concurrecyLevel = concurrecyLevel || 'auto';
	this.runningNb = 0;
	this.callNextFunction();
};

FnQueue.verbose = function(){
	FnQueue.prototype.isVerbose = true;
	return FnQueue;
};

FnQueue.prototype.isVerbose = false;

FnQueue.prototype.onTaskComplete = function(taskName, err, result){

	this.runningNb--;

	if(err){
		this.callback && this.callback(err, this.results);
		return;
	}

	this.results[taskName] = { result: result };
	this.callNextFunction();
};

FnQueue.prototype.callNextFunction = function(){

	var dependencies, finish = true, args;

	for(var taskName in this.tasks){

		if(this.concurrecyLevel != 'auto' && this.runningNb >= this.concurrecyLevel)
			return;

		dependencies = this.tasks[taskName];
		finish = false;

		// no dependecies declared
		if(dependencies instanceof Function){

			this.isVerbose && console.log('FnQueue executing: ' + taskName);

			this.runningNb++;
			delete this.tasks[taskName];
			dependencies(this.onTaskComplete.bind(this, taskName));

			break;
		}

		args = this.getDependencies(dependencies);

		if(args){

			args.push(this.onTaskComplete.bind(this, taskName));

			this.isVerbose && console.log('FnQueue executing: ' + taskName);

			this.runningNb++;
			delete this.tasks[taskName];
			dependencies.pop().apply(null, args);

			if(this.concurrecyLevel != 'auto' && this.runningNb >= this.concurrecyLevel)
				return;
		}
	}

	finish && !this.runningNb && this.callback && this.callback(null, this.results);
};

FnQueue.prototype.getDependencies = function(dependencies){

	var args = [];

	for(var i = 0; i < dependencies.length-1; i++){

		if(this.results[dependencies[i]] === undefined){
			return false;
		}

		var arg = this.results[dependencies[i]].result;

		if(arg !== undefined)
			args.push(arg);
	}

	return args;
};

module.exports = FnQueue;