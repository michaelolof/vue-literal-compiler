"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.first = function (arr) { return arr[0]; };
exports.last = function (arr) { return arr[arr.length - 1]; };
exports.split = function (del) { return function (str) { return str.split(del); }; };
