//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var handlers = require('./lib/handlers.js')
var helpers = require('./lib/helpers')

// HTTP server
var httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

//Starting the HTTP server
httpServer.listen(config.httpPort, function() {
  console.log("The server is listening on port " + config.httpPort);
});

// HTTPS server
var httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpsServerOptions,function(req, res) {
  unifiedServer(req, res);
});

// Starting the HTTPS server
httpsServer.listen(config.httpsPort, function() {
  console.log("The server is listening on port " + config.httpsPort);
});

var unifiedServer = function(req, res) {
  // Parsing the url
  var parsedUrl = url.parse(req.url, true);

  // Get the pathname
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g,'');

  // Get the query string
  var queryStringObject = parsedUrl.query;

  // Get the method
  var method = req.method.toLowerCase();

  // Get the headers
  var headers = req.headers;

  // Get the payload
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data) {
    buffer+= decoder.write(data);
  });

  req.on('end', function() {
    buffer += decoder.end();

    // Route the request to the correct handler
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    var data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : helpers.parseJsonToObject(buffer)
    };

    chosenHandler(data, function(statusCode, payload) {
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      payload = typeof(payload) == 'object' ? payload : {};

      var payloadString = JSON.stringify(payload);

      // Response
      res.setHeader('Content-Type','application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log('Returning this response: ',statusCode, payloadString);
    });

  });
};

// Router
var router = {
  'ping' : handlers.ping,
  'users' : handlers.users
};
