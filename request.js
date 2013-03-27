/**
 * Client-side Request Helper
 * ==========================================================
 *
 * @package     Javie
 * @require     underscore, jQuery/Zepto
 * @version     1.0.0
 * @since       0.1.1
 * @author      Mior Muhammad Zaki <http://git.io/crynobone>
 * @license     MIT License
 */

(function () { 'use strict'; 

	var root, Request, _, api, ev, storage;

	// Save a reference to the global object (`window` in the browser, `global` on the server)
	root = this;

	// Create a safe reference to Request object to be used below.
	Request = function (name) {
		return Request.make(name);
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
		var config = key;

		if ( ! _.isObject(config)) {
			config = {};
			config[key.toString()] = value;
		}
		
		this.config = _.defaults(config, this.config);
	};

	/**
	 * Get Request configuration information.
	 *
	 * <code>
	 * 		Request.get('baseUrl', 'http://foobar.com');
	 * </code>
	 * 
	 * @param  {mixed} key
	 * @param  {mixed} _default
	 * @return {void}
	 */
	Request.get = function get (key, _default) {
		if (_.isUndefined(_default)) _default = null;

		if (_.isUndefined(this.config[key])) return _default;

		return this.config[key];
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
				var own, r, type, uri, tmp;

				own = this;

				if (_.isUndefined(url)) {
					throw new Error('Missing required parameter.');
				}

				if (_.isNull(object)) object = root.document;

				r    = url.split(' ');
				type = "GET";

				own.put({
					'name': name,
					'type': 'GET',
					'query': '',
					'data': '',
					'dataType': (!_.isUndefined(dataType) ? dataType : 'json'),
					'id': '',
					'object': object
				});

				if (r.length === 1) uri = r[0];
				else {
					if (_.indexOf(['POST', 'GET', 'PUT', 'DELETE'], r[0]) > -1) {
						type = r[0];
					}

					uri = r[1];

					if (type !== 'GET') {
						tmp = uri.split('?');
						
						if (tmp.length > 1) {
							uri = tmp[0];
							own.put('query', tmp[1]);
						}
					}

					uri = uri.replace(':baseUrl', self.get('baseUrl', ''));

					own.put({
						'type': type,
						'uri': uri
					});
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
				data = api(own.get('object')).serialize()+'&'+own.get('query');

				if (data === '?&') data = '';

				own.executed = true;

				ev.fire('Request.beforeSend', [own]);
				ev.fire('Request.beforeSend: '+name, [own]);
				own.config.beforeSend(own);

				api.ajax({
					'type': own.get('type'),
					'dataType': own.get('dataType'),
					'url': own.get('uri'),
					'data': data,
					'complete': function complete(xhr) {
						var data, status;

						if (xhr.responseText !== '') {
							data   = parseJSON(xhr.responseText);
							status = xhr.status;

							if ( ! _.isUndefined(data) && data.hasOwnProperty('errors')) {
								ev.fire('Request.onError', [data.errors, status, own]);
								ev.fire('Request.onError: '+name, [data.errors, status, own]);

								own.config['onError'](data.errors, status, own);

								data.errors = null;
							}

							ev.fire('Request.onComplete', [data, status, own]);
							ev.fire('Request.onComplete: '+name, [data, status, own]);

							own.config.onComplete(data, status, own);
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

		cache.config  = _.defaults(cache.config, self.config);
		storage[name] = cache;

		return storage[name];
	};

}).call(this);