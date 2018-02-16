export namespace Core {
  export interface Config {
    timeout: number;
  }

  export interface Options {
    host?: string;
    port?: number;
    config?: Core.Config;
  }
}

export interface Config extends Core.Config {
  timeout: number;
}

export interface DefaultOptions extends Core.Options {
  config: Config;
}

export interface Options extends Core.Options {
  host: string;
  port: number;
  config?: Config;
}

export interface Servers {
  servers: Options;
}

export interface IOptions<T> {
  servers: T[];
}

export interface IConfig {
  timeout: number;
}

export interface IServer {
  config: IConfig;
  host: string;
  msg: Buffer;
  port: number;
}

export interface IServerOptional {
  config?: IConfig;
  host: string;
  msg?: Buffer;
  port?: number;
}

export interface IResponse {
  data: string;
  error: boolean | object;
  server: IServer;
  success: boolean;
  timeout: boolean;
}

type PipeFunction = () => {};
type PipeFunctionWithArg<T> = (arg: T) => {};

interface IRegExp<T extends RegExp> {
  ipv4: T;
  ipv6: T;
}
