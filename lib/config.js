// Configuration variables

var environments = {};

environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret'
};

environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret'
};

var currentEnv = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var environmentToExport = typeof(environments[currentEnv]) == 'object' ? environments[currentEnv] : environments.staging;

module.exports = environmentToExport;
