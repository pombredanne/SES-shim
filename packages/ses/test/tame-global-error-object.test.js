import tap from 'tap';
import { captureGlobals } from '@agoric/test262-runner';
import tameGlobalErrorObject from '../src/tame-global-error-object.js';

const { test } = tap;

test('tameGlobalErrorObject', t => {
  const restore = captureGlobals('Error');

  try {
    tameGlobalErrorObject();

    t.equal(typeof Error.stackTraceLimit, 'number');
    t.equal(Error.stackTraceLimit, 0);
    Error.stackTraceLimit = 11;
    t.equal(Error.stackTraceLimit, 0);
    const error = new Error();
    t.equal(typeof error.stack, 'string');
    Error.captureStackTrace(error);
    t.equal(error.stack, '');
  } catch (e) {
    t.isNot(e, e, 'unexpected exception');
  } finally {
    restore();
    t.end();
  }
});
