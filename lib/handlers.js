// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// handlers
var handlers = {};

// users
handlers.users = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data, callback) {
  // Check that all required fields are filled out
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure user doesn't already exist
    _data.read('users',phone,function(err, data) {
      if(err) {
        // Hashing the password
        var hashedPassword = helpers.hash(password);
        if (hashedPassword) {

          // Create the user object
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users',phone, userObject, function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : 'Could not hash the users password'})
        }
      } else {
        // User already exist
        callback(400,{'Error' : 'A user with that phone number already exists'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }
};

// Users - get
// Required data: phone
// Optional data: none
handlers._users.get = function(data, callback) {
  // Check that the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {

    // Get the token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', phone, function(err, data) {
          if (!err && data) {
            // Remove the hashed password from the user object before returning it to the requester
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });

      } else {
        callback(403, {'Error' : 'Missing required token in header, or token is invalid'});
      }
    });

  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function(data, callback) {
  // Check for the required field
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  // Check for the option field
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the phone is invalid
  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password) {

      // Get the token from the headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (tokenIsValid) {

          // Lookup user
          _data.read('users',phone,function(err, userData) {
            if (!err && userData) {
              // Update the fields necessary
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new updates
              _data.update('users', phone, userData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {'Error' : 'Could not update the user'});
                }
              });
            } else {
              callback(400, {'Error' : 'The specified user does not exist'});
            }
          });

        } else {
          callback(403, {'Error' : 'Missing required token in header, or token is invalid'})
        }
      });

    } else {
      callback(400,{'Error' : 'Missing fields to update'});
    }
  } else {
    callback(400, {'Error' : 'Missing required field'});
  }
};

// Users - delete
// Required field : phone
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = function(data, callback) {
  // Check if the phone number is valid
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {

    // Get the token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {

        // Lookup the user
        _data.read('users', phone, function(err, data) {
          if (!err && data) {
            // Remove the hashed password from the user object before returning it to the requester
            _data.delete('users', phone, function(err) {
              if (!err) {
                callback(200);
              } else {
                callback(500, {'Error' : 'Could not delete the specefied user'});
              }
            });
          } else {
            callback(400, {'Error' : 'Could not find the specified user'});
          }
        });

      } else {
        callback(403, {'Error' : 'Missing required token in header, or token is invalid'})
      }
    });

  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
};

// Tokens
handlers.tokens = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = {};

// Tokens - post
// Required data : phone, password
// Optional data : none
handlers._tokens.post = function(data, callback) {
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    // Lookup the user who matches the phone number
    _data.read('users', phone, function(err, userData) {
      if (!err && userData) {
        // Hash the given password amd check it against the stored password
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // Create a new token with a random name. Set expiration date one hour in the future
          var tokenId = helpers.createRandomString(20);

          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'phone' : phone,
            'id' : tokenId,
            'expires' : expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, function(err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {'Error' : 'Could not create a new token'});
            }
          });
        } else {
          callback(400, {'Error' : 'Password did not match the specified user\' stored password'});
        }
      } else {
        callback(400, {'Error' : 'Could not find the specified user'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required fields'});
  }
};

// Tokens - get
// Required data : id
// Optional data : none
handlers._tokens.get = function(data, callback) {
  // Check that the id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
};

// Tokens - put
// Required data : id, extend
// Optional data : none
handlers._tokens.put = function(data, callback) {
  // Check that the id is valid
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        // Check to make sure that the token isn't expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // Store the new updates
          _data.update('tokens', id, tokenData, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {'Error' : 'Could not update the token\'s expiration'});
            }
          })
        } else {
          callback(400, {'Error' : 'The token has expired and cannot be extended'});
        }
      } else {
        callback(400, {'Error' : 'Specified token does not exist'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required field(s) or field(s) are invalid'});
  }
};

// Tokens - delete
// Requires data : id
// Optional data : none
handlers._tokens.delete = function(data, callback) {
  // Check that the id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        // Remove the hashed password from the user object before returning it to the requester
        _data.delete('tokens', id, function(err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, {'Error' : 'Could not delete the specefied token'});
          }
        });
      } else {
        callback(400, {'Error' : 'Could not find the specified token'});
      }
    });
  } else {
    callback(400, {'Error' : 'Missing required fields'})
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {
  // Lookup the token
  _data.read('tokens', id, function(err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Ping
handlers.ping = function(data, callback) {
  callback(200);
}

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};


module.exports = handlers;
