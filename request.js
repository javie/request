(function () { 'use strict'; 

	var root, Request, _, api, log, ev, storage;

	// Save a reference to the global object (`window` in the browser, `global` on the server)
	root = this;

	// Create a safe reference to Request object to be used below.
	Request = {};
	storage = {};

	// At this point, we don't have a request wrapper for Node.js implementation. So it would be
	// best to display an exception.
	if ('undefined' !== typeof export) {
		throw new Error("Not supported");
	}

	if ('undefined' === typeof root.Javie) {
		throw new Error("Javie is required before using Javie.Request");
	}

	root.Javie.Request = Request;

	if ('undefined' === typeof root.Javie.Logger || 'undefined' === typeof root.Javie.Events) {
		throw new Error("Javie is missing Logger and Events");
	}

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
	Request.config = {
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
	Request.put = function put(key, value) {
		var config = (!_.isString(key)) ? key : { key : value };

		this.config = _.defaults(config, this.config);
	};

	/**
	 * Make a new Request.
	 * 
	 * @param  {string} name
	 * @return {void}
	 */
	Request.make = function make(name) {
		var cache, child, childName, parent, self;

		if (!_.isString(name)) name = 'default';

		self = this;

		// If cache is not empty, this mean that make was initiated before.
		// we should create child instances if the request has been executed.
		if (!_.isUndefined(storage[name])) {
			parent = storage[name];

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
			to: function to (url, object, dataType) {
				var own, r, t, u;

				own = this;

				if (_.isUndefined(url)) {
					throw new Error('Missing required parameter.');
				}

				if (_.isNull(object)) object = root.document;

				r = url.split(' ');
				t = ['POST', 'GET', 'PUT', 'DELETE'];

				own.put({
					'name': name,
					'type': 'GET',
					'uri': '',
					'query': '',
					'data': '',
					'dataType': 'json',
					'id': '',
					'object': object
				})
			},
			get: function get () {
				var own;

				own = this;

				api.ajax({

				});
			},
			config: {
				'name': '',
				'type': 'GET',
				'uri': '',
				'query': '',
				'data': '',
				'dataType': 'json',
				'id': '',
				'object': null
			},
			put: function put (key, value) {
				var config = (!_.isString(key) ? key : { key : value });

				this.config = _.defaults(config, this.config);
			}
		};

		cache.config = _.defaults(cache.config, self.config);

		storage[name] = cache;

		return storage[name];
	};

}).call(this);