"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-ignore
var hyntax_1 = __importDefault(require("hyntax"));
exports.regexp = {
    template: /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Template([\s]+)?\*\/([^`]+)?`[^`]+`/,
    styles: /\/\*\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Styles([\s\*]+)?\*\/([^`]+)?`[^`]+`/,
    customBlock: /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Custom Block([\s]+)?\*\/([^`]+)?`[^`]+`/g,
    langAttr: /lang=[\'\"]([a-z]+:?)[\'\"]/,
};
function replaceMatchedDirective(file, rgx) {
    var matches = [];
    var modified = file.replace(rgx, function (found) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (found.length) {
            var match = (removeDirective(found));
            var start = parseInt(args[5]);
            var end = start + found.length - 1;
            matches.push({
                content: match,
                start: start,
                end: end,
            });
        }
        return "";
    });
    return {
        matches: matches,
        modified: modified,
    };
}
exports.replaceMatchedDirective = replaceMatchedDirective;
function replaceMatchedTemplateDirective(file, rgx) {
    var matches = [], start = 0, end = 0;
    var variableMatcher = /\${([^}]+:?)}/;
    var modified = file.replace(rgx, function (found) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!found.length)
            return "undefined";
        var assignmentStatement = args[3];
        var content = removeDirective(found);
        start = args[4];
        end = found.length + start - 1;
        if (templateIsFunctional(assignmentStatement)) {
            var paramBlk = assignmentStatement.split("=>")[0].split("=")[1].split(":")[0].split("(");
            var param_1 = paramBlk[paramBlk.length - 1].split(")")[0].trim();
            if (param_1.length === 0) {
                throw new Error("Vue Literal Compiler Error:\n" +
                    "Functional Templates with no parameters (() => any) are not supported.\n" +
                    "Either pass a single parameter using the fat arrow syntax or use a simple assignment template.\n" +
                    "\nExamples of supported template signatures are:\n" +
                    "1. const template = `...`\n" +
                    "2. const template = app => `...`\n" +
                    "3. const template = (app) => `...`\n" +
                    "4. const template = (app:App) => `...`\n" +
                    "\n- A Functional template can only have one parameter which represents the instance of the Vue component.\n" +
                    "- Only Fat Arrow Syntax is supported for functional templates\n\n");
            }
            var contentToken = hyntax_1.default.tokenize(content).tokens;
            var variableTokens = fetchVariableTokens(contentToken, variableMatcher);
            var dd = variableTokens.map(function (vtoken) { return resolveContent(vtoken, param_1, variableMatcher); });
            dd.map(function (d) {
                content = replaceContentAtPosition(content, d.orignal, d.replaced);
            });
        }
        matches.push({
            content: content,
            start: start,
            end: end
        });
        return "";
    });
    return {
        matches: matches,
        modified: modified,
    };
    //--------------------------------------------------------
    function templateIsFunctional(assignmentStatement) {
        return assignmentStatement.indexOf("=>") > -1;
    }
    function replaceContentAtPosition(content, token, replaced) {
        return content.replace(token.content, replaced);
    }
    function fetchVariableTokens(tokens, variableMatcher) {
        var variableTokens = [];
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            switch (token.type) {
                case "token:text":
                    var cd = token.content.match(variableMatcher);
                    if (cd === null)
                        break;
                    variableTokens.push(token);
                    break;
                case "token:attribute-value":
                    var cd2 = token.content.match(variableMatcher);
                    if (cd2 === null)
                        break;
                    variableTokens.push(token);
                    break;
                default: break;
            }
        }
        return variableTokens;
    }
    function resolveContent(token, param, variableMatcher) {
        var replaced = token.content.replace(variableMatcher, function (match) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var declaration = args[0];
            var paramCallRegx = new RegExp(param + "([\s]+)?.");
            var resolvedDeclaration = declaration.split(" ").map(function (d) { return d.replace(paramCallRegx, ""); }).join(" ");
            if (token.type === "token:text")
                return "{{ " + resolvedDeclaration + " }}";
            else
                return resolvedDeclaration.trim();
        });
        return {
            orignal: token,
            replaced: replaced,
        };
    }
}
exports.replaceMatchedTemplateDirective = replaceMatchedTemplateDirective;
function normalizeStyles(stylesWithTags, start) {
    var isScoped = undefined;
    var stylesWithHeader = stylesWithTags.trimRight().split(/<\/([\s]+)?style([\s]+)?>/g).filter(function (v) { return v; });
    var styles = stylesWithHeader.map(function (s) {
        var n = normalizeStyle(s, start);
        if (n.scoped)
            isScoped = true;
        start = n.end; // This tells the start index to begin at the end of the previous style;
        return n;
    });
    return {
        isScoped: isScoped,
        styles: styles
    };
    //-------------------------------------------------------------------------------------
    function normalizeStyle(styleWithHeader, start) {
        var lang = undefined;
        var scoped = undefined;
        var attrs = {};
        var styleHeaderRegexp = /<([^>]+)?>/g;
        var styleHeader = "", compStart = 0, compEnd = 0;
        var styleDeclaration = styleWithHeader.replace(styleHeaderRegexp, function (match) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            compStart = args[1] + start;
            compEnd = compStart + styleWithHeader.length;
            styleHeader = match;
            return "";
        });
        // Check for scoped styles
        if (styleHeader.indexOf("scoped") > -1) {
            scoped = true;
            attrs.scoped = true;
        }
        var styleMatch = styleHeader.match(exports.regexp.langAttr);
        if (styleMatch) {
            lang = styleMatch[1];
            attrs.lang = lang;
        }
        return {
            type: "style",
            content: styleDeclaration,
            scoped: scoped,
            lang: lang,
            start: compStart,
            end: compEnd,
            attrs: attrs,
            src: undefined,
            map: undefined,
            module: undefined,
        };
    }
}
exports.normalizeStyles = normalizeStyles;
function normalizeTemplate(templateMarkup, start, end, isScoped) {
    var _a = removeWrappingTemplateTagsIfAny(templateMarkup, start, end), content = _a.content, attrs = _a.attrs;
    return {
        type: "template",
        attrs: attrs,
        content: content,
        start: start,
        end: end,
        scoped: isScoped,
        lang: attrs.lang,
        map: undefined,
        module: undefined,
        src: undefined,
    };
    function removeWrappingTemplateTagsIfAny(templateMarkup, start, end) {
        var attrs = {};
        templateMarkup = templateMarkup.trim();
        if (templateMarkup.length === 0)
            return { content: "", attrs: attrs };
        var firstTagRegexp = /<((.|\n)*?):?>/;
        var firstTagRegexpArr = templateMarkup.match(firstTagRegexp);
        if (firstTagRegexpArr === null) {
            // markup has no initail tag name.
            throw new Error("\n<template> tag not found.\n" +
                "Usage of template tag is only optional if you're writing html.\n" +
                "Are you trying to use a different template lang like pug or jade?\n" +
                "If so specify the template language you're using:\n" +
                "Example:\n" +
                "<template lang=\"jade\">\n" +
                "...\n" +
                "</template>");
        }
        else {
            var tagString = firstTagRegexpArr[1];
            var tagName = tagString.split(" ")[0];
            if (tagName === "template") {
                var match = firstTagRegexpArr[0];
                // Remove opening tag
                var tempArr = templateMarkup.split(match);
                tempArr.shift();
                templateMarkup = tempArr.join(match);
                // Remove closing template tag.
                tempArr = templateMarkup.split("</");
                tempArr.pop();
                templateMarkup = tempArr.join("</");
                var m = tagString.match(exports.regexp.langAttr);
                if (m)
                    attrs.lang = m[1];
            }
            return {
                content: templateMarkup,
                attrs: attrs,
            };
        }
    }
}
exports.normalizeTemplate = normalizeTemplate;
function normalizeCustomBlocks(customBlocksDeclartion) {
    return customBlocksDeclartion.map(function (c) { return normalize(c); });
    function normalize(customBlock) {
        var type = "";
        var attrs = {};
        var customBlockTypeRegex = /<(([\s]+)?[^>]+:?)>/;
        var headerless = customBlock.content.replace(customBlockTypeRegex, function (match) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var inner = args[0];
            type = inner.replace(exports.regexp.langAttr, function (_) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                attrs.lang = args[0];
                return "";
            });
            return "";
        });
        var endRegexp = new RegExp("<\/([\s]+)?" + type.trim() + "([\s]+)?>");
        var content = headerless.replace(endRegexp, "");
        return {
            content: content,
            attrs: attrs,
            type: type,
            start: customBlock.start,
            end: customBlock.end,
            map: undefined,
        };
    }
}
exports.normalizeCustomBlocks = normalizeCustomBlocks;
function normalizeScripts(modifiedFile) {
    return {
        type: "script",
        content: modifiedFile,
        lang: "ts",
        attrs: { lang: "ts" },
        start: 0,
        end: modifiedFile.length // Pass in an arbitraty number.
    };
}
exports.normalizeScripts = normalizeScripts;
function removeDirective(match) {
    var startLiteralIndex = match.indexOf("`");
    var endDirective = match.indexOf("`", startLiteralIndex + 1);
    return match.slice(startLiteralIndex + 1, endDirective);
}
