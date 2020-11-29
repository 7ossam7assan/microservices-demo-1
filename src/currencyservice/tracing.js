"use strict";

const opentelemetry = require("@opentelemetry/api");
const { NodeTracerProvider } = require("@opentelemetry/node");
const {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} = require("@opentelemetry/tracing");

// To test export to jaeger
// const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
const { CollectorTraceExporter } = require("@opentelemetry/exporter-collector");

const EXPORTER = process.env.EXPORTER || "";

module.exports = (serviceName) => {
  const provider = new NodeTracerProvider();

  /* To use jaeger
    const jaegerExporter = new JaegerExporter({
      serviceName,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));
  */

  /* to use the collector exporter
  const collectorExporter = new CollectorTraceExporter({
    serviceName,
    // logger: new ConsoleLogger(LogLevel.DEBUG),
    // headers: {
    //   foo: 'bar'
    // },
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(collectorExporter));
  */

  // Also add console exporter - at least for debugging
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register();

  return opentelemetry.trace.getTracer(serviceName);
};
