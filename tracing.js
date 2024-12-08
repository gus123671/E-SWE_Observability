'use strict';

// Import necessary OpenTelemetry modules
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { trace } = require("@opentelemetry/api");

// Import Jaeger Exporter
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

// Instrumentations
const { ExpressInstrumentation } = require("opentelemetry-instrumentation-express");
const { MongoDBInstrumentation } = require("@opentelemetry/instrumentation-mongodb");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");

// Export a function to initialize tracing
module.exports = (serviceName) => {
   // Create the Jaeger exporter
   const jaegerExporter = new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces', // Default Jaeger endpoint
      username: process.env.JAEGER_USERNAME || '', // Optional if authentication is needed
      password: process.env.JAEGER_PASSWORD || ''  // Optional if authentication is needed
   });

   // Create a new Node Tracer Provider with the service name
   const provider = new NodeTracerProvider({
      resource: new Resource({
         [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      }),
   });

   // Add a span processor to send spans to Jaeger
   provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));

   // Register the tracer provider
   provider.register();

   // Register the instrumentations (HTTP, Express, and MongoDB)
   registerInstrumentations({
      instrumentations: [
         new HttpInstrumentation(),
         new ExpressInstrumentation(),
         new MongoDBInstrumentation(),
      ],
      tracerProvider: provider,
   });

   // Return the tracer for use in the application
   return trace.getTracer(serviceName);
};
