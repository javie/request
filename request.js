(function () { 'use strict'; 

	var root, Requests, _, api;

	// Save a reference to the global object (`window` in the browser, `global` on the server)
	root = this;

	// Create a safe reference to Requests object to be used below.
	Requests = {};

	// At this point, we don't have a request wrapper for Node.js implementation. So it would be
	// best to display an exception.
	if ('undefined' !== typeof export) {
		throw new Error("Not supported");
	}

	if ('undefined' === typeof root.Javie) root.Javie = {};

	root.Javie.Request = Requests;

	// Load all the dependencies
	_ = root._;

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
		baseUrl: null,
		'onError': function onError (data, status) {},
		beforeSend: function beforeSend (data, status) {},
		onSuccess: function onSuccess (data, status) {}
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
		if (!_.isString(name)) name = 'default';

	};



}).call(this);