/* global Compartment */

import { resolve } from "./node-module-specifier.js";

const { entries } = Object;

// q, as in quote, for strings in error messages.
const q = JSON.stringify;

export const assemble = ({
  name,
  compartments,
  makeImportHook,
  parents = [],
  loaded = {},
  endowments = {},
  modules = {}
}) => {
  const descriptor = compartments[name];
  if (descriptor === undefined) {
    throw new Error(
      `Cannot assemble compartment graph with missing compartment descriptor named ${q(
        name
      )}, needed by ${parents.map(q).join(", ")}`
    );
  }
  const result = loaded[name];
  if (result !== undefined) {
    return result;
  }
  if (parents.includes(name)) {
    throw new Error(`Cannot assemble compartment graph that includes a cycle`);
  }

  for (const [inner, outer] of entries(descriptor.modules || {})) {
    const { compartment: compartmentName, module: moduleSpecifier } = outer;
    const compartment = assemble({
      name: compartmentName,
      compartments,
      makeImportHook,
      parents: [...parents, name],
      loaded,
    });
    modules[inner] = compartment.module(moduleSpecifier);
  }

  const compartment = new Compartment(endowments, modules, {
    resolveHook: resolve,
    importHook: makeImportHook(descriptor.root)
  });

  loaded[name] = compartment;
  return compartment;
};
