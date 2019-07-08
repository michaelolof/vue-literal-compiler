//@ts-ignore
import * as compiler from "vue-template-compiler";
import { parseComponentUsingComments as _parseComponent } from "./parse-component"
import { parseComponent as __parseComponent } from "./new-parse-component"

export const parseComponent = __parseComponent;
// export const parseComponent = _parseComponent
export const compile = compiler.compile;
export const compileToFunctions = compiler.compileToFunctions;
export const ssrCompile = compiler.ssrCompile;
export const ssrCompileToFunctions = compiler.ssrCompileToFunctions;
