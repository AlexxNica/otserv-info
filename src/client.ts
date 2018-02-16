'use strict';

import * as net from 'net';
import logger from './logger';
import { random, colors, converters } from './utils';

//#region -> config
import('./config');
//#endregion -> config

//#region -> interfaces
interface IOptions {
  servers: IServer[];
}

interface IConfig {
  timeout: number;
}

interface IServer {
  config: IConfig;
  host: string;
  msg: Buffer;
  port: number;
}

interface IResponse {
  data: string;
  error: boolean | object;
  server: IServer;
  success: boolean;
  timeout: boolean;
}
//#endregion

//#region -> defaults
const defaultOptions = {
  config: {
    timeout: 10000,
  },
  port: 7171,
};
//#endregion

// Get information about a specific server.
const getInfo = (server: IServer): Promise<IResponse> => {
  let dataReceived: string;
  let errorReceived: (object | boolean);
  let timeout: boolean;

  logger.debug(colors.green('running:'), server);

  return new Promise((resolve: (resolve: IResponse) => void): void => {
    const socket = new net.Socket();

    socket.setTimeout(server.config.timeout);
    socket.once('connect', () => logger.debug(colors.green('connect:'), server));
    socket.once('drain', () => logger.debug('drain!'));
    socket.once('data', (data: Buffer) => {
      const dataFormatted = converters.toString(data);

      logger.debug(`${colors.green(`data: ${server.host}`)}`, dataFormatted);
      dataReceived = dataFormatted;
      socket.destroy();
    });

    socket.once('end', () => {
      logger.debug(`end: ${server.host} | dataReceived: ${!!dataReceived}`);
      socket.destroy();
    });

    socket.once('close', () => {
      logger.debug(`close: ${server.host} | dataReceived: ${!!dataReceived}`);
      socket.destroy();

      resolve({
        data: dataReceived,
        error: (typeof errorReceived !== 'undefined' && errorReceived || false),
        server,
        success: !!dataReceived,
        timeout: !!timeout,
      });
    });

    socket.once('error', (err: Error) => {
      logger.debug(colors.red('error:'), err);
      errorReceived = {
        error: err.name,
        message: err.message,
        stack: err.stack,
      };
      socket.end();
      socket.destroy();
    });

    socket.once('timeout', () => {
      logger.debug(colors.red('timeout:'), server);
      timeout = true;
      socket.end();
      socket.destroy();
    });

    socket.connect({ host: server.host, port: server.port });
    socket.write(server.msg);
  });
};

/**
 * Client for the library - receives a JSON payload, process everything
 * and decide which function to call based on options set by the caller
*/
const client = (options: IOptions): Promise<Buffer> => {
  const optionsFormatted = { ...defaultOptions, ...options };
  const serverMap = new Map();
  const stats = {
    errors: 0,
    nodata: 0,
    successes: 0,
    timeouts: 0,
    total: 0,
  };
  let count = 0;

  return new Promise((resolve: (response: Buffer) => void): void => {
    optionsFormatted.servers.forEach((current: IServer) => {
      logger.debug('getInfo:', current);
      getInfo(current).then((obj: IResponse): void => {
        logger.debug('getInfo.then!');
        count += 1;
        stats.total = count;
        stats.successes += +!!obj.success;
        stats.nodata += +!!(!obj.data && !obj.error && !obj.timeout);
        stats.errors += +!!obj.error;
        stats.timeouts += +!!obj.timeout;
        serverMap.set(obj.server.host, obj);
        logger.debug(obj);
        logger.debug();
        // tslint:disable-next-line:no-any
        if (count === options.servers.length) {
          resolve(random.serialize({ response: serverMap, stats }));
        }
      });
    });
  });
};

export default client;
