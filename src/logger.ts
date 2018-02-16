'use strict';

const logger = Object.create({});

logger.debug = (...args: {}[]): void => {
  if (process.env.DEBUG) {
    console.log(...args);
  }
};

export default logger;
