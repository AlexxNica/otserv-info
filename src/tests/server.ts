'use strict';

/**
 * | WORK IN PROGRESS! | WORK IN PROGRESS! | WORK IN PROGRESS! |
 * |       TRAFFIC GENERATOR AND RECEIVER USED IN TESTS        |
 * | WORK IN PROGRESS! | WORK IN PROGRESS! | WORK IN PROGRESS! |
 */

import * as net from 'net';
import * as os from 'os';
import * as cluster from 'cluster';
import * as v8 from 'v8';
import logger from '../logger';
import serverList from '../serverList';

//#region -> config
import('../config');
const numCPUs = os.cpus().length;
//#endregion -> config

// @ts-ignore
const serialize = v8.serialize;
// @ts-ignore
const deserialize = v8.deserialize;
// @ts-ignore
const serializer = new v8.Serializer();

//#region -> helpers
const getRandomIntInclusive = (min: number, max: number): number =>
  // tslint:disable-next-line:insecure-random
  Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
//#endregion -> helpers

if (cluster.isMaster) {
  //#region -> helpers
  // tslint:disable-next-line:no-magic-numbers
  logger.debug('\n'.repeat(15));
  const maxServers = 300;
  const servers = serverList.splice(0, maxServers); // [].length = 300
  const divideBy = 5;
  const serverTotal = (maxServers / divideBy); // 60
  // tslint:disable-next-line:no-magic-numbers
  const serverHalf = (serverTotal / 2); // 30
  // const randomServers = getRandomServers(serverTotal, servers); // 60
  const randomServers = servers.slice(0, serverTotal); // 60
  const firstHalf = randomServers.slice(0, serverHalf);
  const secondHalf = randomServers.slice(serverHalf, serverTotal);
  const serversToTimeout = firstHalf;
  const serversToClose = secondHalf;
  const toSend = new Map();

  toSend.set('servers', servers);
  toSend.set('toTimeout', serversToTimeout);
  toSend.set('toClose', serversToClose);
  //#endregion -> helpers

  logger.debug(`maxToTimeout: ${serverHalf} | maxToClose: ${serverHalf}`);
  logger.debug('servers:', randomServers.length);
  logger.debug('serverstoTimeout:', serversToTimeout);
  logger.debug('serversToClose:', serversToClose);
  logger.debug();
  logger.debug(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i += 1) {
    const worker = cluster.fork();

    worker.send(serialize(toSend));
  }

  // @FIX: look for a better alternative for the type.
  cluster.on('exit', (worker: {process: {pid: number}}) => {
    logger.debug(`worker ${worker.process.pid} died`);
  });
} else {
  //#region -> logic
  // @ts-ignore
  let servers: string[] | undefined;
  let serversToTimeout: string[] | undefined;
  let serversToClose: string[] | undefined;

  logger.debug(`Worker ${process.pid} is running`);

  // @FIX: find a better alternative for the type.
  process.on('message', (msg: {data: Buffer}): void => {
    const data: Map<string, string[]> = deserialize(Buffer.from(msg.data));

    servers = data.get('servers');
    serversToTimeout = data.get('toTimeout');
    serversToClose = data.get('toClose');

    // console.log('servers:', servers.length);
    // console.log('serversToTimeout:', serversToTimeout);
    // console.log('serversToClose:', serversToClose);
  });

  const server = net.createServer((socket: NodeJS.Socket): void => {
    socket.on('data', (data: Buffer) => {
      const dataString: string = String(data);

      logger.debug('data:', dataString);
      if (serversToClose !== undefined && serversToClose.includes(dataString)) {
        socket.end();
      } else if (serversToTimeout !== undefined && !serversToTimeout.includes(dataString)) {
        setTimeout(() => {
          socket.end(dataString);
        // tslint:disable-next-line:align no-magic-numbers
        }, getRandomIntInclusive(1000, 5000));
      }
    });
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    logger.debug('error', err);
    server.close();
  });

  server.on('close', () => logger.debug('close'));

  server.listen({ port: 7171 }, () => {
    logger.debug('server listening on', server.address());
  });
  //#endregion -> logic
}
