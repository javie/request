###
 * ==========================================================
 * Javie.Request
 * ==========================================================
 *
 * Request Helper for Client-side JavaScript
 *
 * @package Javie
 * @class   Request
 * @require underscore, jQuery/Zepto
 * @version 1.1.0-dev
 * @since   0.1.1
 * @author  Mior Muhammad Zaki <https://github.com/crynobone>
 * @license MIT
 * ==========================================================
###

root = exports ? @
requests = {}
events = null

unless typeof root.Javie isnt 'undefined'
	throw new Error("Javie is missing")
unless typeof root.Javie.EventDispatcher isnt 'undefined'
	throw new Error("Javie.EventDispatcher is missing")

events = root.Javie.EventDispatcher.make()

_ = root._
_ = require('underscore') if !_ and require?

unless _
	throw new Error("underscore.js is missing")

api = root.$

if typeof api is 'undefined' or api is null
	throw new Error("Required jQuery or Zepto object is missing")

class Request
	json_parse = (data) ->
		data = api.parseJSON(data) if _.isString(data) is yes
		data
	executed: false
	config:
		'name': ''
		'type': 'GET'
		'uri': ''
		'query': ''
		'data': ''
		'dataType': 'json'
		'id': ''
		'object': null
	get: (key, alt) ->
		return @config[key] if typeof @config[key] isnt 'undefined'
		alt ?= null
	put: (key, value) ->
		config = key
		unless _.isObject(key)
			config =
				key: value
		@config = _.defaults(config, @config)
	to: (url, object, data_type) ->
		@put({'dataType': data_type ?= 'json'})
		request_method = ['POST', 'GET', 'PUT', 'DELETE']

		if typeof url is 'undefined'
			throw new Error("Missing required url parameter")

		unless object?
			object = root.document

		segment = url.split(' ')

		if segment.length is 1
			uri = segment[0]
		else
			if _.indexOf(request_method, segment[0]) is yes
				type = segment[0]

			uri = segment[1]

			if type isnt 'GET'
				queries = uri.split('?')

				if queries.length > 1
					url = queries[0]
					@put('query', queries[1])

			uri = uri.replace(':baseUrl', @get('baseUrl', ''))
			@put({
				'type': type
				'uri': uri
			})

		id = api(@get('object')).attr('id')
		@put({'id': "##{id}"}) if typeof id isnt 'undefined'
		@
	execute: (data) ->
		self = @

		unless _.isObject(data)
			data = "#{api(@get('object')).serialize()}&#{@get('query')}"
			data = '' if data is '?&'

		@executed = true

		events.fire('Request.beforeSend', [@])
		events.fire("Request.beforeSend: #{name}", [@])
		@config['beforeSend'](@)

		request =
			'type': @get('type')
			'dataType': @get('dataType')
			'url': @get('uri')
			'data': data
			'complete': (xhr) ->
				data = json_parse(xhr.responseText)
				status = xhr.status

				if typeof data isnt 'undefined' and data.hasOwnProperty('errors')
					events.fire('Request.onError', [data.errors, status, self])
					events.fire("Request.onError: #{name}", [data.errors, status, self])
					self.config['onError'](data.errors, status, self)
					data.errors = null

				events.fire('Request.onComplete', [data, status, self])
				events.fire("Request.onComplete: #{name}", [data, status, self])
				self.config['onComplete'](data, status, self)

				true
		api.ajax(request)
		@

class RequestRepository
	find_request = (name) ->
		request = null
		unless typeof requests[name] is 'undefined'
			parent = requests[name]

			if parent.executed is yes
				child_name = _.uniqueId("#{name}_")
				child = new Request

				events.clone("Request.onError: #{name}").to("Request.onError: #{child_name}");
				events.clone("Request.onComplete: #{name}").to("Request.onComplete: #{child_name}");
				events.clone("Request.beforeSend: #{name}").to("Request.beforeSend: #{child_name}");

				child.put(parent.config)
				request = child
			request = parent
		else
			request = new Request
			request.config = _.defaults(request.config, RequestRepository.config)
			request.put({'name': name})
			requests[name] = request

		request

	constructor: (name) ->
		return RequestRepository.make(name)
	@make: (name) ->
		name = 'default' unless _.isString(name)
		find_request(name)
	@config:
		'baseUrl': null
		'onError': (data, status) ->
		'beforeSend': (data, status) ->
		'onComplete': (data, status) ->
	@get: (key, alt) ->
		alt ?= null
		return alt if typeof @config[key] is 'undefined'
		@config[key]
	@put: (key, value) ->
		config = key
		unless _.isObject(key)
			config =
				key: value
		@config = _.defaults(config, @config)

if exports?
	module.exports = RequestRepository if module? and module.exports
	root.Request = RequestRepository
else
	root.Javie.Request = RequestRepository
