// Copyright (C) 2018 Agoric
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import makeHardener from '@agoric/make-hardener';

import { assert } from './assert.js';
import { getIntrinsics } from './intrinsics.js';
import whitelistIntrinsics from './whitelist-intrinsics.js';
import repairLegacyAccessors from './repair-legacy-accessors.js';

import tameFunctionConstructors from './tame-function-constructors.js';
import tameGlobalDateObject from './tame-global-date-object.js';
import tameGlobalErrorObject from './tame-global-error-object.js';
import tameGlobalMathObject from './tame-global-math-object.js';
import tameGlobalRegExpObject from './tame-global-reg-exp-object.js';
import enablePropertyOverrides from './enable-property-overrides.js';

let firstOptions;

// A successful lockdown call indicates that `harden` can be called and
// guarantee that the hardened object graph is frozen out to the fringe.
let lockedDown = false;

// Build a harden() with an empty fringe.
// Gate it on lockdown.
const lockdownHarden = makeHardener();

export const harden = ref => {
  assert(lockedDown, `Cannot harden before lockdown`);
  return lockdownHarden(ref);
};

export function lockdown(options = {}) {
  // First time, absent options default to 'safe'.
  // Subsequent times, absent options default to first options.
  // Thus, all present options must agree with first options.
  // Reconstructing `option` here also ensures that it is a well
  // behaved record, with only own data properties.
  options = { ...firstOptions, ...options };
  const {
    dateTaming = 'safe',
    errorTaming = 'safe',
    mathTaming = 'safe',
    regExpTaming = 'safe',

    ...extraOptions
  } = options;

  // Assert that only supported options were passed.
  // Use Reflect.ownKeys to reject symbol-named properties as well.
  const extraOptionsNames = Reflect.ownKeys(extraOptions);
  assert(
    extraOptionsNames.length === 0,
    `lockdown(): non supported option ${extraOptionsNames.join(', ')}`,
  );

  // Asserts for multiple invocation of lockdown().
  if (firstOptions) {
    Object.keys(firstOptions).forEach(name => {
      assert(
        options[name] === firstOptions[name],
        `lockdown(): cannot re-invoke with different option ${name}`,
      );
    });
    // Returning `false` indicates that lockdown() made no changes because it
    // was invoked from SES with non-conflicting options.
    return false;
  }

  firstOptions = {
    dateTaming,
    errorTaming,
    mathTaming,
    regExpTaming,
  };

  /**
   * 1. TAME powers first.
   */
  tameFunctionConstructors();

  tameGlobalDateObject(dateTaming);
  tameGlobalErrorObject(errorTaming);
  tameGlobalMathObject(mathTaming);
  tameGlobalRegExpObject(regExpTaming);

  /**
   * 2. WHITELIST to standardize the environment.
   */

  // Extract the intrinsics from the global.
  const intrinsics = getIntrinsics();

  // Remove non-standard properties.
  whitelistIntrinsics(intrinsics);

  // Repair problems with legacy accessors if necessary.
  repairLegacyAccessors();

  /**
   * 3. HARDEN to share the intrinsics.
   */

  // Circumvent the override mistake.
  const detachedProperties = enablePropertyOverrides(intrinsics);

  // Finally register and optionally freeze all the intrinsics. This
  // must be the operation that modifies the intrinsics.
  lockdownHarden(intrinsics);
  lockdownHarden(detachedProperties);

  // Having completed lockdown without failing, the user may now
  // call `harden` and expect the object's transitively accessible properties
  // to be frozen out to the fringe.
  // Raise the `harden` gate.
  lockedDown = true;

  // Returning `true` indicates that this is a JS to SES transition.
  return true;
}
