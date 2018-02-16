'use strict';

import * as util from 'util';

util.inspect.defaultOptions = {
  colors: true,
  depth: null,
  // tslint:disable-next-line:no-null-keyword
  maxArrayLength: null,
  showHidden: true,
  // breakLength: Infinity,
};
