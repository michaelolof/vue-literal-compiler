//@ts-ignore
import * as compiler from "vue-template-compiler";

export * from "./parseComponent";
export const compile = compiler.compile;
export const compileToFunctions = compiler.compileToFunctions;
export const ssrCompile = compiler.ssrCompile;
export const ssrCompileToFunctions = compiler.ssrCompileToFunctions;
