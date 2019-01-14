"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-ignore
var compiler = __importStar(require("vue-template-compiler"));
var parse_component_1 = require("./parse-component");
exports.parseComponent = parse_component_1.parseComponent;
exports.compile = compiler.compile;
exports.compileToFunctions = compiler.compileToFunctions;
exports.ssrCompile = compiler.ssrCompile;
exports.ssrCompileToFunctions = compiler.ssrCompileToFunctions;
