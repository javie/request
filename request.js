(function () { 'use strict'; 

	var root, Request, _, api, ev, storage;

	// Save a reference to the global object (`window` in the browser, `global` on the server)
	root = this;

	// Create a safe reference to Request object to be used below.
	Request = function (name) {
		return this.make(name);
	};
	
	storage = {};

	// At this point, we don't have a request wrapper for Node.js implementation. So it would be
	// best to display an exception.
	if ('undefined' !== typeof exports) {
		throw new Error("Not supported");
	}

	if ('undefined' === typeof root.Javie) {
		throw new Error("Javie is required before using Javie.Request");
	}

	root.Javie.Request = Request;

	if ('undefined' === typeof root.Javie.Events) {
		throw new Error("Javie is missing Logger and Events");
	}

	// Load all the dependencies
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
		'onComplete': function onComplete (data, status) {}
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
	 * <code>
	 * 		var r = Javie.Request.make('foo');
	 * </code>
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
				ev.clone('Request.onComplete: '+name).to('Request.onComplete: '+childName);
				ev.clone('Request.beforeSend: '+name).to('Request.beforeSend: '+childName);

				child.put(parent.config);

				return child;
			}

			return parent;
		}

		cache = {
			/**
			 * Execution status.
			 * 
			 * @type {Boolean}
			 */
			executed: false,
			
			/**
			 * Create a request wrapper for a form.
			 *
			 * <code>
			 * 		r.to('GET http://google.com?q=foobar', document.getElementById('foo'), 'JSON');
			 * </code>
			 * 
			 * @param  {string}      url
			 * @param  {DOMDocument} object
			 * @param  {string}      dataType e.g: JSON, XML etc.
			 * @return {self}
			 */
			to: function to (url, object, dataType) {
				var own, r, t, u, tmp;

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
					'query': '',
					'data': '',
					'dataType': (!_.isUndefined(dataType) ? dataType : 'json'),
					'id': '',
					'object': object
				});

				if (r.length === 1) own.put('uri', r[0]);
				else {
					if (_.indexOf(t, r[0]) > -1) own.put('type', r[0]);

					own.put('uri', r[1]);

					if (this.type !== 'GET') {
						tmp = own.get('uri', '').split('?');

						if (tmp.length > 0) {
							own.put({
								'query': tmp[1],
								'uri': tmp[0]
							});
						}
					}
				}

				own.put('id', '#'+api(own.get('object')).attr('id'));

				return this;

			},

			/**
			 * Execute the request.
			 *
			 * <code>
			 * 		r.execute();
			 * </code>
			 * 
			 * @return {void}
			 */
			execute: function execute () {
				var own, data;

				own  = this;
				data = api(this.get('object')).serialize()+'&'+this.get('query');

				this.executed = true;

				ev.fire('Request.beforeSend', [own]);
				ev.fire('Request.beforeSend: '+name, [own]);

				own.beforeSend(own);

				api.ajax({
					'type': this.get('type'),
					'dataType': this.get('dataType'),
					'url': this.get('uri'),
					'data': data,
					'complete': function complete(xhr) {
						var data, status;

						if (xhr.responseText !== '') {
							data   = parseJSON(xhr.responseText);
							status = xhr.status;

							if (data.hasOwnProperty('errors')) {
								ev.fire('Request.onError', [data.errors, status, own]);
								ev.fire('Request.onError: '+name, [data.errors, status, own]);

								own['onError'](data.errors, status, own);

								data.errors = null;
							}

							ev.emit('Request.onComplete', [data, status, own]);
							ev.emit('Request.onComplete: '+name, [data, status, own]);

							own.onComplete(data, status, self);
						}
					}
				});
			},

			/**
			 * Request configurations.
			 *
			 * @type {Object}
			 */
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

			/**
			 * Update or overwrite a configuration.
			 * 
			 * @param  {mixed} key
			 * @param  {mixed} value
			 * @return {void}
			 */
			put: function put (key, value) {
				var config = (!_.isString(key) ? key : { key : value });

				this.config = _.defaults(config, this.config);
			},

			/**
			 * Get a configuration value.
			 * 
			 * @param  {string} key
			 * @param  {mixed}  defaults
			 * @return {mixed}
			 */
			get: function get (key, defaults) {
				if (_.isUndefined(defaults)) defaults = null;

				return (!_.isUndefined(this.config[key]) ? this.config[key] : defaults);
			}
		};

		cache.config = _.defaults(cache.config, self.config);

		storage[name] = cache;

		return storage[name];
	};

}).call(this);