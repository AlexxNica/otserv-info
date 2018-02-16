'use strict';

import client from './client';
import { DefaultOptions, IOptions, IServer, IServerOptional } from '../typings';
import { random } from './utils';
import logger from './logger';
import serverList from './tests/serverList';

//#region -> config
import('./config');
// @ts-ignore
const defaultOptions: DefaultOptions = {
  config: {
    timeout: 10000,
  },
  port: 7171,
};
//#endregion

// Message that will be sent as a Buffer.
const hex: string[] = ['0x06', '0x00', '0xFF', '0xFF', '0x69', '0x6E', '0x66', '0x6F'];
const msg: Buffer = Buffer.from(hex);
// Maximum of servers to get info.
const maxServers = 9999;

// @ts-ignore (only for testing & debugging)
const newServers: IOptions<IServerOptional> = {
  servers: [
    { host: '127.0.0.1', port: 7171 },
    { host: '127.0.0.1' },
    { host: '127.0.0.1', config: { timeout: 1 } },
  ],
};

// Example of how the payload will be sent: [{ host: '127.0.0.1', port: 7171, msg: <Buffer 00>, config: {timeout: 1} }]
const servers: IServer[] = random.array.removeDuplicates(serverList)
  .splice(0, maxServers)
  .map((item: string[]) => ({
    config: {
      timeout: 10000,
    },
    host: item,
    msg,
    port: 7171,
  }));
const options: IOptions<IServer> = { servers };

logger.debug('servers:', servers);
logger.debug('options', options);

client(options).then((res: Buffer) => {
  logger.debug();
  logger.debug('index -> .then! \\/');
  logger.debug(res);
  logger.debug('random.deserialize:', random.deserialize(res));
});
