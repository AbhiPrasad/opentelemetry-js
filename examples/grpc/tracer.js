'use strict';

const opentelemetry = require('@opentelemetry/api');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { GrpcInstrumentation } = require('@opentelemetry/instrumentation-grpc');

const EXPORTER = process.env.EXPORTER || '';

const Sentry = require('@sentry/node');

const { SentrySpanProcessor, SentryPropagator } = require('@sentry/opentelemetry-node')

Sentry.init({
  dsn: '__MY_DSN__',
  instrumenter: 'otel',
  tracesSampleRate: 1.0,
});

module.exports = (serviceName) => {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });

  let exporter;
  if (EXPORTER.toLowerCase().startsWith('z')) {
    exporter = new ZipkinExporter();
  } else {
    exporter = new JaegerExporter();
  }

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.addSpanProcessor(new SentrySpanProcessor())

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register({ propagator: new SentryPropagator() });

  registerInstrumentations({
    instrumentations: [
      new GrpcInstrumentation(),
    ],
  });

  return opentelemetry.trace.getTracer('grpc-example');
};
