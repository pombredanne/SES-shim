import tap from 'tap';
import { captureGlobals } from '@agoric/test262-runner';
import tameGlobalDateObject from '../src/main.js';

const { test } = tap;

test('tameGlobalDateObject - constructor without argument', t => {
  t.plan(4);

  const restore = captureGlobals('Date');
  tameGlobalDateObject();

  const date = new Date();

  t.ok(date instanceof Date);
  t.equal(date.toString(), 'Invalid Date');

  const date2 = new Date.prototype.constructor();

  t.ok(date2 instanceof Date);
  t.equal(date2.toString(), 'Invalid Date');

  restore();
});

test('tameGlobalDateObject - now', t => {
  t.plan(1);

  const restore = captureGlobals('Date');
  tameGlobalDateObject();

  const date = Date.now();

  t.ok(Number.isNaN(date));

  restore();
});

test('tameGlobalIntlObject - toLocaleString', { skip: true }, t => {
  t.plan(1);

  const restore = captureGlobals('Error');
  tameGlobalDateObject();

  const date = new Date(Date.UTC(2012, 11, 20, 3, 0, 0));

  t.throws(() => date.toLocaleString(), 'suppressed');
  t.throws(() => Object.prototype.toLocaleString.apply(date), 'suppressed');

  restore();
});
