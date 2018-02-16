'use strict';

//#region -> IMPORTS
import * as v8 from 'v8';
import chalk from 'chalk';
import logger from './logger';
import { PipeFunction, PipeFunctionWithArg, IRegExp } from '../typings';
//#endregion

//#region -> INITIALIZERS & EXPORTS
export const general = Object.create({});
export const checkers = Object.create({});
export const converters = Object.create({});
export const getters = Object.create({});
export const mergers = Object.create({});
export const helpers = Object.create({});
export const returners = Object.create({});
export const debug = Object.create({});
export const log = Object.create({});
export const random = Object.create({});
export const colors = Object.create({});
export const adders = Object.create({});
export const removers = Object.create({});
//#endregion

//#region -> GENERAL
// Compose functions from top to bottom/left to right.
// tslint:disable-next-line:ban-types
general.pipe = (...fns: PipeFunction[]): {} =>
  (x: PipeFunctionWithArg<{}>): {} =>
    fns.reduce((v: {}, fn: PipeFunctionWithArg<{}>) => fn(v), x);
// tslint:disable-next-line:ban-types
general.asyncPipe = (...fns: PipeFunction[]): {} =>
  (x: Promise<PipeFunction>): {} =>
    fns.reduce(async (y: Promise<{}>, fn: PipeFunctionWithArg<{}>) => fn(await y), x);
general.pipeAsync = general.asyncPipe;
// tslint:disable-next-line:ban-types
general.pipeDebug = (...fns: PipeFunction[]): {} =>
  general.pipe(...general.addTraceToEveryFunction(fns));
// Compose functions from bottom to top/right to left.
// tslint:disable-next-line:ban-types
general.compose = (...fns: PipeFunction[]): {} =>
  (x: PipeFunction): {} =>
    fns.reduceRight((v: {}, fn: PipeFunctionWithArg<{}>) => fn(v), x);
general.trace = (label: string): {} => (value: ({})): {} => {
  logger.debug(`${chalk.bold.blue(label)}:`, value);

  return value;
};
general.composeMethod = (chainMethod: string | number): {} => (...ms: {}[]): {} => (
  // @ts-ignore: NEEDS TYPE FIX.
  ms.reduce((fn: PipeFunction, g: PipeFunctionWithArg<{}>): {} =>
  // @ts-ignore: NEEDS TYPE FIX.
    (x: {}): {} => g(x)[chainMethod](fn))
);
general.composePromises = general.composeMethod('then');
general.composeMap = general.composeMethod('map');
general.composeFlatMap = general.composeMethod('flatMap');
general.curry = (fn: PipeFunction): {} =>
// tslint:disable-next-line:boolean-trivia no-null-keyword
  (...args: PipeFunction[]): {} => fn.bind(null, ...args);
general.map = general.curry((fn: PipeFunction, arr: {}[]) => arr.map(fn));
general.join = general.curry((str: string, arr: {}[]) => arr.join(str));
general.split = general.curry((splitOn: string | RegExp, str: string) => str.split(splitOn));
general.tap = general.curry((fn: PipeFunctionWithArg<{}>, x: {}) => {
  fn(x);

  return x;
});
general.tappedTrace = (label: string): {} =>
  general.tap((x: {}) => logger.debug(`== ${label}:  ${x}`));
// @FIX: not working/not getting the function name if the function is anonymous
// and comes from a variable (arrow).
general.addTraceToEveryFunction = (fns: PipeFunction[]): {} => {
  const newFns: PipeFunction[] = [];
  for (const fn of fns) {
    newFns.push(fn);
    newFns.push(general.trace(fn.name));
  }

  return newFns;
};
//#endregion

//#region -> CHECKERS
checkers.isNotEmpty = (arg: {}): {} => (secondArg: undefined = undefined): boolean | undefined => {
  if (secondArg !== undefined && !checkers.isEmpty(secondArg)) {
    return secondArg;
  }

  return checkers.isEmpty(arg);
};

// @TODO: use better types of check.
checkers.isObject = (arg: object): boolean => (typeof arg === 'object');
checkers.isArray = (arg: {}[]): boolean => (Array.isArray(arg));
checkers.isString = (arg: string): boolean => (typeof arg === 'string');
checkers.isUndefined = (arg: undefined): boolean => (typeof arg === 'undefined');
checkers.objHasKey = (key: string): {} => (obj: object): boolean => (key in obj);
// tslint:disable-next-line:no-any
checkers.isEmpty = (arg: any): boolean => checkers.isUndefined(arg) || arg.length === 0;
//#endregion

//#region -> CONVERTERS
// @TODO: remove dependency of app specific stuff.
// tslint:disable-next-line:no-any
converters.toArray = (arg: any): {}[] => {
  if (checkers.isObject(arg) && checkers.objHasKey('host')(arg)) {
    return [arg.host];
  }

  if (checkers.isString(arg)) {
    return [arg];
  }

  return arg;
};
converters.toString = String;
converters.toBuffer = (arg: string): Buffer => Buffer.from(arg, 'utf-8');
// @TODO: find a better name and category.
converters.processArray = (arr: string[]): {} =>
  (action: PipeFunctionWithArg<{}>): {}[] => {
    const list = [];
    for (const item of arr) {
      list.push(action(item));
    }

    return list;
  };

converters.toCharCodeArray = (arg: string[]): number[] =>
  converters.processArray(arg[0])(getters.firstCharCode);
// tslint:disable-next-line:no-magic-numbers
converters.toHex = (charCode: number): string => charCode.toString(16);
converters.arrayToHex = (arg: string[]): string[] =>
  converters.processArray(arg)(converters.toHex);
// @FIX: type can be just string, not being an array.
converters.toHexLiteral = (arg: string[]): string | string[] =>
  checkers.isString(arg) && `0x${arg}` || arg.map((v: string) => `0x${v}`);

// @FIX: not working.
converters.stringToBuffer = general.pipe(
  converters.toArray, general.trace('converters.toArray'),
  converters.toCharCodeArray, general.trace('converters.toCharCodeArray'),
  converters.arrayToHex, general.trace('converters.arrayToHex'),
  converters.toHexLiteral, general.trace('converters.toHexLiteral'),
);

converters.toNewObjectWithHost = (host: string): object => ({ host });
//#endregion

//#region -> HELPERS
helpers.emptyBuffer = Buffer.alloc(0);
helpers.reverseArray = (arr: {}[]): {}[] => arr.reverse();
//#endregion

//#region -> GETTERS
getters.firstFromArray = (arg: {}[]): {} => arg[0];
getters.firstCharCode = (arg: string): number => arg.charCodeAt(0);
//#endregion

//#region -> MERGERS
mergers.mergeObjects = (firstObj: object): object =>
  (secondObj: object): object => ({ ...firstObj, ...secondObj });
// tslint:disable-next-line:no-any
mergers.concatBuffers = (...buffersArray: any[]): Buffer =>
  Buffer.concat([].concat(...buffersArray));
//#endregion

//#region -> RETURNERS
returners.returnVariable = (variable: string): {} =>
  (): string => variable;
//#endregion

//#region -> DEBUG
debug.printArg = (newArg: {}): PipeFunctionWithArg<{}> =>
  (oldArg: {}): {} => newArg || oldArg;
debug.returnTheReturned = (arg: {}): {} => arg;
debug.printHello = (): string => 'hello';
//#endregion

//#region -> RANDOM
random.array = Object.create({});
random.array.removeDuplicates = (arr: {}[]): {}[] => [...new Set(arr)];
// @ts-ignore
random.serialize = v8.serialize;
// @ts-ignore
random.deserialize = v8.deserialize;
//#endregion

//#region -> COLORS
colors.red = chalk.bold.red;
colors.blue = chalk.bold.blue;
colors.green = chalk.bold.green;
colors.magenta = chalk.bold.magenta;
colors.grey = chalk.bold.grey;
colors.yellow = chalk.bold.yellow;
colors.cyan = chalk.bold.cyan;
//#endregion

//#region -> REGEX
// @ts-ignore: FIX!
const regExp: IRegExp = {
  // tslint:disable-next-line:max-line-length
  genericURI: /^([a-zA-Z][a-zA-Z0-9+-.]*):((\/\/(((([a-zA-Z0-9\-._~!$&'()*+,;=':]|(%[0-9a-fA-F]{2}))*)@)?((\[((((([0-9a-fA-F]{1,4}:){6}|(::([0-9a-fA-F]{1,4}:){5})|(([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:){4})|((([0-9a-fA-F]{1,4}:)?[0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:){3})|((([0-9a-fA-F]{1,4}:){0,2}[0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:){2})|((([0-9a-fA-F]{1,4}:){0,3}[0-9a-fA-F]{1,4})?::[0-9a-fA-F]{1,4}:)|((([0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4})?::))((([0-9a-fA-F]{1,4}):([0-9a-fA-F]{1,4}))|(([0-9]|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5]))\.([0-9]|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5]))\.([0-9]|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5]))\.([0-9]|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5])))))|((([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4})?::[0-9a-fA-F]{1,4})|((([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4})?::))|(v[0-9a-fA-F]+\.[a-zA-Z0-9\-._~!$&'()*+,;=':]+))\])|(([0-9]|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5]))\.([0-9]|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5]))\.([0-9]|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5]))\.([0-9]|(1[0-9]{2})|(2[0-4][0-9])|(25[0-5])))|(([a-zA-Z0-9\-._~!$&'()*+,;=']|(%[0-9a-fA-F]{2}))*))(:[0-9]*)?)((\/([a-zA-Z0-9\-._~!$&'()*+,;=':@]|(%[0-9a-fA-F]{2}))*)*))|(\/?(([a-zA-Z0-9\-._~!$&'()*+,;=':@]|(%[0-9a-fA-F]{2}))+(\/([a-zA-Z0-9\-._~!$&'()*+,;=':@]|(%[0-9a-fA-F]{2}))*)*)?))(\?(([a-zA-Z0-9\-._~!$&'()*+,;=':@\/?]|(%[0-9a-fA-F]{2}))*))?((#(([a-zA-Z0-9\-._~!$&'()*+,;=':@\/?]|(%[0-9a-fA-F]{2}))*)))?$/igm,
  // tslint:disable-next-line:max-line-length
  ipv4: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/igm,
  // tslint:disable-next-line:max-line-length
  ipv6: /^(::| (([a - fA - F0 - 9]{ 1, 4}):) { 7}(([a - fA - F0 - 9]{ 1, 4}))| (: (: ([a - fA - F0 - 9]{ 1, 4 })) { 1, 6 })| ((([a - fA - F0 - 9]{ 1, 4 }):) { 1, 6 }:)| ((([a - fA - F0 - 9]{ 1, 4 }):) (: ([a - fA - F0 - 9]{ 1, 4 })) { 1, 6 })| ((([a - fA - F0 - 9]{ 1, 4 }):) { 2 } (: ([a - fA - F0 - 9]{ 1, 4 })) { 1, 5 })| ((([a - fA - F0 - 9]{ 1, 4 }):) { 3 } (: ([a - fA - F0 - 9]{ 1, 4 })) { 1, 4 })| ((([a - fA - F0 - 9]{ 1, 4 }):) { 4 } (: ([a - fA - F0 - 9]{ 1, 4 })) { 1, 3 })| ((([a - fA - F0 - 9]{ 1, 4 }):) { 5 } (: ([a - fA - F0 - 9]{ 1, 4 })) { 1, 2 }))$/igm,
};
//#endregion

//#region -> MOVE TO THE CORRECT SECTION
removers.removeProtocol = (url: string): string => url.replace(/^https?\:\/\//igm, '');
adders.addHttps = (url: string): string => `https://${url}`;
adders.addHost = (host: string, path: string): string => `${host}/${path}`;
// tslint:disable-next-line:no-any - FIX!
mergers.concatArray = (arr: any[]): {}[] => [].concat(...arr);
converters.toInt = parseInt;
checkers.isInt = Number.isInteger;
checkers.isIPV4 = (ip: string): boolean => regExp.ipv4.test(ip);
checkers.isIPV6 = (ip: string): boolean => regExp.ipv6.test(ip);
checkers.isGenericURI = (uri: string): boolean => regExp.genericURI.test(uri);
checkers.isHost = (host: string): boolean =>
  checkers.isIPV4(host) && checkers.isIPV6(host) && checkers.isGenericURI(host);
checkers.stringIsInt = (arg: string): boolean => checkers.isInt(converters.toInt(arg));
checkers.hasProtocol = (arg: string): boolean => (/^(?:f|ht)tps?\:\/\//.test(arg));
random.checkAndAddHttps = (url: string): string =>
  (checkers.hasProtocol(url) && url || adders.addHttps(url));
//#endregion
