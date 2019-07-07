"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.first = function (arr) { return arr[0]; };
exports.last = function (arr) { return arr[arr.length - 1]; };
exports.split = function (del) { return function (str) { return str.split(del); }; };
function pipe(fn1) {
    var fns = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        fns[_i - 1] = arguments[_i];
    }
    return fns.reduce(function (prevFn, nextFn) { return function (value) { return nextFn(prevFn(value)); }; }, fn1);
}
exports.pipe = pipe;
