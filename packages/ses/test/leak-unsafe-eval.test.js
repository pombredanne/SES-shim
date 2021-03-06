import tap from 'tap';
import sinon from 'sinon';
import { Compartment } from '../src/compartment-shim.js';
import stubFunctionConstructors from './stub-function-constructors.js';

const { test } = tap;

test('HostException in eval revokes unsafeEval', t => {
  t.plan(2);

  // Mimic repairFunctions.
  stubFunctionConstructors(sinon);

  // Prevent output
  sinon.stub(console, 'error').callsFake();

  const c = new Compartment();

  const endowments = { $$eval$$: null };
  try {
    c.evaluate(
      `
      function loop(){
        (0, eval)('1');
        loop();
      }

      try {      
        loop();
      } catch(e) {}

      $$eval$$ = eval;
    `,
      { endowments },
    );
    // eslint-disable-next-line no-empty
  } catch (err) {}

  t.equal(endowments.$$eval$$, c.globalThis.eval, "should be realm's eval");
  t.notEqual(endowments.$$eval$$, globalThis.eval, 'should not be unsafe eval');

  sinon.restore();
});

test('HostException in Function revokes unsafeEval', t => {
  t.plan(2);

  // Mimic repairFunctions.
  stubFunctionConstructors(sinon);

  // Prevent output
  sinon.stub(console, 'error').callsFake();

  const c = new Compartment();

  const endowments = { $$eval$$: null };
  try {
    c.evaluate(
      `
      function loop(){
        Function('1');
        loop();
      }

      try {      
        loop();
      } catch(e) {}

      $$eval$$ = eval;
    `,
      { endowments },
    );
    // eslint-disable-next-line no-empty
  } catch (err) {}

  t.equal(endowments.$$eval$$, c.globalThis.eval, "should be realm's eval");
  t.notEqual(endowments.$$eval$$, globalThis.eval, 'should not be unsafe eval');

  sinon.restore();
});
