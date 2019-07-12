"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-ignore 
var hyntax_1 = __importDefault(require("hyntax"));
var typescript_1 = require("typescript");
exports.regexp = {
    langAttr: /lang=[\'\"]([a-z]+:?)[\'\"]/,
};
function tokenizeContent(fileContent) {
    var source = typescript_1.createSourceFile("vue.lit.ts", fileContent, typescript_1.ScriptTarget.Latest);
    var arrs = [];
    function callback(node) {
        switch (node.kind) {
            case typescript_1.SyntaxKind.ImportDeclaration:
                //@ts-ignore
                return arrs.push(new ImportDefinition(node));
            case typescript_1.SyntaxKind.TaggedTemplateExpression:
                //@ts-ignore
                return arrs.push(new TaggedLiteral(node));
            case typescript_1.SyntaxKind.ArrowFunction:
                //@ts-ignore
                return arrs.push(new FatArrowLiteral(node, fileContent));
        }
    }
    ;
    function iterator(sourceFile) {
        sourceFile.forEachChild(function (childNode) {
            // Only a class can use a decorator. So we search for classes.
            callback(childNode);
            iterator(childNode);
        });
    }
    iterator(source);
    return arrs;
}
exports.tokenizeContent = tokenizeContent;
function removeDeclarations(fileContent, _a) {
    var template = _a.template, styles = _a.styles, customBlocks = _a.customBlocks;
    var templateMatch, styleMatches = [], customBlockMatches = [];
    if (template)
        templateMatch = fileContent.substring(template.start, template.end);
    if (styles.length > 0)
        styleMatches = styles.map(function (style) { return fileContent.substring(style.start, style.end); });
    if (customBlocks.length > 0)
        customBlockMatches = customBlocks.map(function (custom) { return fileContent.substring(custom.start, custom.end); });
    if (templateMatch)
        fileContent = fileContent.replace(templateMatch, "");
    for (var _i = 0, styleMatches_1 = styleMatches; _i < styleMatches_1.length; _i++) {
        var style = styleMatches_1[_i];
        fileContent = fileContent.replace(style, "");
    }
    for (var _b = 0, customBlockMatches_1 = customBlockMatches; _b < customBlockMatches_1.length; _b++) {
        var block = customBlockMatches_1[_b];
        fileContent = fileContent.replace(block, "");
    }
    return fileContent;
}
exports.removeDeclarations = removeDeclarations;
function resolveTemplateBindings(parameter, fatArrowBody) {
    var variableMatcher = /\${([^}]+:?)}/;
    var contentToken = hyntax_1.default.tokenize(fatArrowBody).tokens;
    var variableTokens = fetchVariableTokens(contentToken, variableMatcher);
    var dd = variableTokens.map(function (vtoken) { return resolveContent(vtoken, parameter); });
    dd.map(function (d) { return fatArrowBody = replaceContentAtPosition(fatArrowBody, d.orignal, d.replaced); });
    return fatArrowBody;
    //-------------------------------------------------------------------
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
    function resolveContent(token, param) {
        var replaced = token.content;
        var openLiteralCurlyBracesPosition = token.content.indexOf("${");
        if (openLiteralCurlyBracesPosition > -1) {
            if (token.type === "token:text") {
                replaced = replaceAtPosition(replaced, openLiteralCurlyBracesPosition, "{");
                var closingLiteralCurlyBracesPosition = replaced.lastIndexOf("}");
                replaced = replaceAtPosition(replaced, closingLiteralCurlyBracesPosition, "}}");
            }
            else {
                replaced = replaceAtPosition(replaced, openLiteralCurlyBracesPosition, "");
                replaced = replaceAtPosition(replaced, openLiteralCurlyBracesPosition, "");
                var closingLiteralCurlyBracesPosition = replaced.lastIndexOf("}");
                replaced = replaceAtPosition(replaced, closingLiteralCurlyBracesPosition, "");
            }
            replaced = replaced.replace("<any>", "");
            var paramCallRegx_1 = new RegExp(param + "([\s]+)?.");
            replaced = replaced.split(" ").map(function (d) { return d.replace(paramCallRegx_1, ""); }).join(" ");
        }
        return {
            orignal: token,
            replaced: replaced,
        };
    }
    function replaceContentAtPosition(content, token, replaced) {
        return content.replace(token.content, replaced);
    }
    function replaceAtPosition(str, index, replace) {
        return str.substring(0, index) + replace + str.substring(index + 1);
    }
}
exports.resolveTemplateBindings = resolveTemplateBindings;
function normalizeStyle(styleWithHeader, start, end) {
    var content = "";
    var attrs = {};
    var lang = "";
    var scoped = undefined;
    var styleHeader = "";
    // Remove ending style tag to avoid match dupication.
    styleWithHeader = styleWithHeader.trimRight().replace(/<\/([\s]+)?style([\s]+)?>/g, "");
    var styleHeaderRegexp = /<([^>]+)?>/g;
    content = styleWithHeader.replace(styleHeaderRegexp, function (match) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        styleHeader = args[0];
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
        content: content,
        scoped: scoped,
        lang: lang,
        start: start,
        end: end,
        attrs: attrs,
        src: undefined,
        map: undefined,
        module: undefined,
    };
}
exports.normalizeStyle = normalizeStyle;
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
                // Check template header for lang attribute.
                var langAttrMatched = tagString.match(exports.regexp.langAttr);
                if (langAttrMatched)
                    attrs.lang = langAttrMatched[1];
                // Check template header for functional attribute.
                if (tagString.indexOf("functional") > -1)
                    attrs.functional = true;
            }
            return {
                content: templateMarkup,
                attrs: attrs,
            };
        }
    }
}
exports.normalizeTemplate = normalizeTemplate;
function normalizeCustomBlock(_a) {
    var content = _a.content, start = _a.start, end = _a.end;
    var type = "";
    var attrs = {};
    var customBlockTypeRegex = /<(([\s]+)?[^>]+:?)>/;
    var headerless = content.replace(customBlockTypeRegex, function (match) {
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
    var customBlockContent = headerless.replace(endRegexp, "");
    return {
        content: customBlockContent,
        attrs: attrs,
        type: type,
        start: start,
        end: end,
        map: undefined,
    };
}
exports.normalizeCustomBlock = normalizeCustomBlock;
function normalizeScript(modifiedFile) {
    return {
        type: "script",
        content: modifiedFile,
        lang: "ts",
        attrs: { lang: "ts" },
        start: 0,
        end: modifiedFile.length // Pass in an arbitraty number.
    };
}
exports.normalizeScript = normalizeScript;
var TaggedLiteral = /** @class */ (function () {
    function TaggedLiteral(node) {
        this.isFunctional = false;
        //@ts-ignore
        this._tag = node.tag;
        //@ts-ignore
        this.body = node.template.text;
        this.start = node.pos;
        this.end = node.end;
    }
    Object.defineProperty(TaggedLiteral.prototype, "tag", {
        get: function () {
            return this._tag.escapedText;
        },
        enumerable: true,
        configurable: true
    });
    return TaggedLiteral;
}());
exports.TaggedLiteral = TaggedLiteral;
var ImportDefinition = /** @class */ (function () {
    function ImportDefinition(node) {
        this.imports = [];
        //@ts-ignore
        this.module = node.moduleSpecifier.text;
        this.start = node.pos;
        this.end = node.end;
        //@ts-ignore
        if (node.importClause && node.importClause.namedBindings && node.importClause.namedBindings.elements) {
            //@ts-ignore
            var elements = node.importClause.namedBindings.elements;
            for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
                var element = elements_1[_i];
                //@ts-ignore
                if (element.name && !element.propertyName) {
                    // Import does not have an alias
                    this.imports.push({
                        //@ts-ignore
                        name: element.name.escapedText,
                    });
                }
                else if (element.propertyName && element.name) {
                    // Import has an alias.
                    this.imports.push({
                        //@ts-ignore
                        name: element.propertyName.escapedText,
                        //@ts-ignore
                        alias: element.name.escapedText
                    });
                }
            }
        }
    }
    return ImportDefinition;
}());
exports.ImportDefinition = ImportDefinition;
var FatArrowLiteral = /** @class */ (function () {
    function FatArrowLiteral(node, fileContent) {
        this.body = undefined;
        this.parameters = [];
        this.isFunctional = false;
        this.start = node.pos;
        this.end = node.end;
        //@ts-ignore
        this.tag = node.body.tag.escapedText;
        //@ts-ignore
        if (node.body.template) {
            this.body = {
                //@ts-ignore
                text: fileContent.substring(node.body.template.pos + 1, node.body.template.end - 1),
                //@ts-ignore
                start: node.body.template.pos,
                //@ts-ignore
                end: node.body.template.end,
            };
        }
        //@ts-ignore
        this.parameters = node.parameters.map(function (p) { return p.name.escapedText; });
    }
    return FatArrowLiteral;
}());
exports.FatArrowLiteral = FatArrowLiteral;
