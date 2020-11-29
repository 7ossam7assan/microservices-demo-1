/*
 * Copyright 2018 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

if (process.env.DISABLE_PROFILER) {
  console.log("Profiler disabled.");
} else {
  console.log("Profiler enabled.");
  require("@google-cloud/profiler").start({
    serviceContext: {
      service: "currencyservice",
      version: "1.0.0",
    },
  });
}

if (process.env.DISABLE_TRACING) {
  console.log("Tracing disabled.");
} else {
  console.log("Tracing enabled.");
  require("@google-cloud/trace-agent").start();
}

if (process.env.DISABLE_DEBUGGER) {
  console.log("Debugger disabled.");
} else {
  console.log("Debugger enabled.");
  require("@google-cloud/debug-agent").start({
    serviceContext: {
      service: "currencyservice",
      version: "VERSION",
    },
  });
}

const path = require("path");
const grpc = require("grpc");
const pino = require("pino");
const axios = require("axios");
const currencyEndpoint = `http://${process.env.EXT_CURRENCY_SERVICE_ADDR}`;
const protoLoader = require("@grpc/proto-loader");

const MAIN_PROTO_PATH = path.join(__dirname, "./proto/demo.proto");
const HEALTH_PROTO_PATH = path.join(
  __dirname,
  "./proto/grpc/health/v1/health.proto"
);

const PORT = process.env.PORT;

const shopProto = _loadProto(MAIN_PROTO_PATH).hipstershop;
const healthProto = _loadProto(HEALTH_PROTO_PATH).grpc.health.v1;

const logger = pino({
  name: "currencyservice-server",
  messageKey: "message",
  changeLevelName: "severity",
  useLevelLabels: true,
});

/**
 * Helper function that loads a protobuf file.
 */
function _loadProto(path) {
  const packageDefinition = protoLoader.loadSync(path, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(packageDefinition);
}

/**
 * Helper function that handles decimal/fractional carrying
 */
function _carry(amount) {
  const fractionSize = Math.pow(10, 9);
  amount.nanos += (amount.units % 1) * fractionSize;
  amount.units =
    Math.floor(amount.units) + Math.floor(amount.nanos / fractionSize);
  amount.nanos = amount.nanos % fractionSize;
  return amount;
}

/**
 * Lists the supported currencies
 */
async function getSupportedCurrencies(call, callback) {
  try {
    logger.info("Getting supported currencies...");
    const supportedRequestResult = await axios.get(
      `${currencyEndpoint}/supported`
    );
    return callback(null, { currency_codes: supportedRequestResult.data });
  } catch (err) {
    logger.error(`Supported currency request failed: ${err}`);
    // Be a bit resillient and move on even if the service is down
    return callback(null, { currency_codes: [] });
  }
}

/**
 * Converts between currencies
 */
async function convert(call, callback) {
  logger.info("received conversion request");

  try {
    const request = call.request;

    logger.info("Making conversion request...");
    const conversionRequestResult = await axios.post(
      `${currencyEndpoint}/convert`,
      { from: request.from, to: request.to_code }
    );

    const data = conversionRequestResult.data;

    logger.info(`conversion request successful`);
    callback(null, data);
  } catch (err) {
    // Return the initial value instead of failing completely here
    logger.error(`conversion request failed: ${err}`);
    callback(null, call.request.from);
  }
}

/**
 * Endpoint for health checks
 */
function check(call, callback) {
  callback(null, { status: "SERVING" });
}

/**
 * Starts an RPC server that receives requests for the
 * CurrencyConverter service at the sample server port
 */
function main() {
  logger.info(`Starting gRPC server on port ${PORT}...`);
  const server = new grpc.Server();
  server.addService(shopProto.CurrencyService.service, {
    getSupportedCurrencies,
    convert,
  });
  server.addService(healthProto.Health.service, { check });
  server.bind(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure());
  server.start();
}

main();
