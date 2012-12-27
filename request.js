(function () { 'use strict'; 

	var root, Requests, _, api, log, ev, caches;

	// Save a reference to the global object (`window` in the browser, `global` on the server)
	root = this;

	// Create a safe reference to Requests object to be used below.
	Requests = {};

	caches   = {};

	// At this point, we don't have a request wrapper for Node.js implementation. So it would be
	// best to display an exception.
	if ('undefined' !== typeof export) {
		throw new Error("Not supported");
	}

	if ('undefined' === typeof root.Javie) {
		throw new Error("Javie is required before using Javie.Request");
	}

	root.Javie.Request = Requests;

	// Load all the dependencies
	log = root.Javie.Logger.make();
	ev  = root.Javie.Events.make();
	_   = root._;

	if (!_ && 'undefined' !== typeof require) _ = require('underscore');
	
	// Map jQuery or Zepto instance, but I'm not really into this dollar sign stuff since in 
	// this scope we are focusing on the `ajax` method available from these libraries.
	api = root.$;

	if ('undefined' === typeof api || null === api) {
		throw new Error("Required jQuery or Zepto object is not available.");
	}

	function parseJSON(data) {
		if (_.isString(data)) data = api.parseJSON(data);

		return data;
	};

	/**
	 * Request configuration.
	 * 
	 * @type {Object}
	 */
	Requests.config = {
		'baseUrl': null,
		'onError': function onError (data, status) {},
		'beforeSend': function beforeSend (data, status) {},
		'onSuccess': function onSuccess (data, status) {}
	};

	/**
	 * Update Request configuration information.
	 *
	 * <code>
	 * 		Request.put('baseUrl', 'http://foobar.com');
	 *
	 * 		Request.put({
	 * 			'baseUrl' : 'http://foobar.com',
	 * 			'onError' : function (data, status) { // do something awesome }
	 * 		});
	 * </code>
	 * 
	 * @param  {mixed} key
	 * @param  {mixed} value
	 * @return {void}
	 */
	Requests.put = function put(key, value) {
		var config = (!_.isString(key)) ? key : { key : value };

		this.config = _.defaults(config, this.config);
	};

	/**
	 * Make a new Request.
	 * 
	 * @param  {string} name
	 * @return {void}
	 */
	Requests.make = function make(name) {
		var cache, child, childName, parent, self;

		if (!_.isString(name)) name = 'default';

		self = this;

		// If cache is not empty, this mean that make was initiated before.
		// @todo we should create child instances if the request has been
		// executed.
		if (!_.isUndefined(caches[name])) {
			parent = caches[name];

			// If parent has been executed, we need to create a child instance.
			if (parent.executed === true) {
				childName = _.uniqueId(name+'_');
				child     = self.make(childName);

				// Replicate all parent configuration to child.
				ev.clone('Request.onError: '+name).to('Request.onError: '+childName);
				ev.clone('Request.onSuccess: '+name).to('Request.onSuccess: '+childName);
				ev.clone('Request.beforeSend: '+name).to('Request.beforeSend: '+childName);

				child.put(parent.config);

				return child;
			}

			return parent;
		}

		cache = {
			executed: false,
			to: function to (url, data) {
				
			},
			get: function get () {
				var own;

				own = this;

				api.ajax({

				});
			},
			config: {
				'onError': null,
				'beforeSend': null,
				'onSuccess': null
			},
			put: function put (key, value) {
				var config = (!_.isString(key) ? key : { key : value });

				this.config = _.defaults(config, this.config);
			}
		};



		return cache;
	};

}).call(this);