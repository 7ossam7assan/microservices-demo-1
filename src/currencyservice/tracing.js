"use strict";

const opentelemetry = require("@opentelemetry/api");
const { NodeTracerProvider } = require("@opentelemetry/node");
const {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} = require("@opentelemetry/tracing");

// To test export to jaeger
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");

// JSON over HTTP
// https://github.com/open-telemetry/opentelemetry-js/tree/master/packages/opentelemetry-exporter-collector
const { CollectorTraceExporter } = require("@opentelemetry/exporter-collector");

// GRPC Collector protocol
// https://github.com/open-telemetry/opentelemetry-js/tree/master/packages/opentelemetry-exporter-collector-grpc
const {
  CollectorTraceExporterGrpc,
} = require("@opentelemetry/exporter-collector-grpc");

// Protobuf Collector Protocol
// https://github.com/open-telemetry/opentelemetry-js/tree/master/packages/opentelemetry-exporter-collector-proto
const {
  CollectorTraceExporterProto,
} = require("@opentelemetry/exporter-collector-proto");

const EXPORTER = process.env.EXPORTER || "";

module.exports = (serviceName) => {
  const provider = new NodeTracerProvider();

  /*
  // Enable jaeger exporter
  const jaegerExporter = new JaegerExporter({
    serviceName,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));
  */

  /*
  // Enable collector exporter
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
