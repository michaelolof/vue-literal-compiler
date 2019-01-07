"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-ignore
var hyntax_1 = __importDefault(require("hyntax"));
var templateRegexp = /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Template([\s]+)?\*\/([^`]+)?`[^`]+`/;
var stylesRegexp = /\/\*\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Styles([\s\*]+)?\*\/([^`]+)?`[^`]+`/;
var customBlocksRegexp = /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Custom Block([\s]+)?\*\/([^`]+)?`[^`]+`/g;
var langAttrRegexp = /lang=[\'\"]([a-z]+:?)[\'\"]/;
function parseComponent(file, options) {
    if (options === void 0) { options = { pad: "line" }; }
    var isScoped = undefined;
    var styles = [];
    var template = null;
    var customBlocks = [];
    var script;
    var stylesReplacement = findAndReplaceDirective(file, stylesRegexp);
    file = stylesReplacement.modified;
    if (stylesReplacement.matches.length) {
        var n = normalizeStyles(stylesReplacement.matches[0].content, stylesReplacement.matches[0].start);
        styles = n.styles;
        isScoped = n.isScoped;
    }
    var templateReplacement = findAndReplaceFunctionalTemplate(file, templateRegexp);
    if (templateReplacement.matches.length) {
        template = normalizeTemplate(templateReplacement.matches[0].content, templateReplacement.matches[0].start, templateReplacement.matches[0].end, isScoped);
    }
    file = templateReplacement.modified;
    var custBlocksReplacement = findAndReplaceDirective(file, customBlocksRegexp);
    file = custBlocksReplacement.modified;
    if (custBlocksReplacement.matches.length) {
        customBlocks = normalizeCustomBlocks(custBlocksReplacement.matches);
    }
    script = normalizeScripts(file);
    return {
        template: template,
        script: script,
        styles: styles,
        customBlocks: customBlocks,
    };
    // throw new Error('Code Block Not Implemented Yet.').stack;
}
exports.parseComponent = parseComponent;
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
            type = inner.replace(langAttrRegexp, function (_) {
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
function normalizeTemplate(templateMarkup, start, end, isScoped) {
    var _a = removeTemplateTagIfAny(templateMarkup), content = _a.content, attrs = _a.attrs;
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
    function removeTemplateTagIfAny(templateMarkup) {
        var attrs = {};
        var templateHeaderRegexp = /(<([\s]+)?template(([\s]+:?))?([^>]+)?>)|<\/([\s]+)?template([\s]+)?>/g;
        var templateAttrs = "";
        var content = templateMarkup.replace(templateHeaderRegexp, function (match) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (args[4])
                templateAttrs = args[4];
            return "";
        });
        if (templateAttrs) {
            var m = templateAttrs.match(langAttrRegexp);
            if (m)
                attrs.lang = m[1];
        }
        return {
            attrs: attrs,
            content: content,
        };
    }
}
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
        var styleMatch = styleHeader.match(langAttrRegexp);
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
function findAndReplaceFunctionalTemplate(file, rgx) {
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
        console.log(content);
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
            var resolvedDeclaration = declaration.replace(paramCallRegx, "");
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
function findAndReplaceDirective(file, rgx) {
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
function removeDirective(match) {
    var startLiteralIndex = match.indexOf("`");
    var endDirective = match.indexOf("`", startLiteralIndex + 1);
    return match.slice(startLiteralIndex + 1, endDirective);
}
