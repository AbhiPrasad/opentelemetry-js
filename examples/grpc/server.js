'use strict';

const api = require('@opentelemetry/api');
const tracer = require('./tracer')(('example-grpc-server'));
const grpc = require('grpc');

const messages = require('./helloworld_pb');
const services = require('./helloworld_grpc_pb');

const PORT = 50051;

/** Starts a gRPC server that receives requests on sample server port. */
function startServer() {
  // Creates a server
  const server = new grpc.Server();
  server.addService(services.GreeterService, { sayHello });
  server.bind(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure());
  console.log(`binding server on 0.0.0.0:${PORT}`);
  server.start();
}

function sayHello(call, callback) {
  const currentSpan = api.trace.getSpan(api.context.active());
  // display traceid in the terminal
  console.log(`traceid: ${currentSpan.spanContext().traceId}`);
  const span = tracer.startSpan('server.js:sayHello()', {
    parent: currentSpan,
    kind: 1, // server
    attributes: { key: 'value' },
  });
  span.addEvent(`invoking sayHello() to ${call.request.getName()}`);
  const reply = new messages.HelloReply();
  reply.setMessage(`Hello ${call.request.getName()}`);
  span.end();
  callback(null, reply);
}

startServer();
