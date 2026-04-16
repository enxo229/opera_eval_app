const { LoggerProvider } = require('@opentelemetry/sdk-logs');
const lp = new LoggerProvider();
console.log('Available methods on LoggerProvider:', Object.getOwnPropertyNames(Object.getPrototypeOf(lp)));
