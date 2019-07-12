"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var index_1 = require("../parse-component/index");
// const moduleName = "vue-literal-compiler/tags";
var moduleName = "../utils";
function parseComponent(fileContent, options) {
    if (options === void 0) { options = { pad: "line" }; }
    var styles = [];
    var template = null;
    var customBlocks = [];
    var script = null;
    var tokens = utils_1.tokenizeContent(fileContent);
    if (tokens === undefined)
        return index_1.parseComponentUsingComments(fileContent, options);
    var importToken = tokens.find(function (token) { return token instanceof utils_1.ImportDefinition && token.module === moduleName; });
    if (importToken === undefined)
        return index_1.parseComponentUsingComments(fileContent, options);
    // Extract literal and fatarrow tokens.
    var fatArrowTokens = tokens.filter(function (t) { return t instanceof utils_1.FatArrowLiteral; });
    var literalTokens = tokens.filter(function (t) { return t instanceof utils_1.TaggedLiteral; });
    // Handle Style Tags.
    var resolvedStyle = resolveStyleLiteralTag({ importToken: importToken, literalTokens: literalTokens });
    var isScoped = resolvedStyle.isScoped;
    styles = resolvedStyle.styles;
    // Handle Template Tags.
    template = resolveTemplateLiteralTag({ importToken: importToken, fatArrowTokens: fatArrowTokens, literalTokens: literalTokens, isScoped: isScoped });
    // Handle Custom Blocks
    customBlocks = resolveCustomBlocks({ importToken: importToken, literalTokens: literalTokens });
    console.log(template);
    // Remove all template, styles and custom blocks
    var scriptsOnly = utils_1.removeDeclarations(fileContent, {
        template: template,
        styles: styles,
        customBlocks: customBlocks
    });
    // Handle Script.
    script = utils_1.normalizeScript(scriptsOnly);
    return {
        template: template,
        script: script,
        styles: styles,
        customBlocks: customBlocks
    };
}
exports.parseComponent = parseComponent;
function resolveCustomBlocks(_a) {
    var importToken = _a.importToken, literalTokens = _a.literalTokens;
    var customBlocks = [];
    var customBlockImport = importToken.imports.find(function (imp) { return imp.name === "customBlock"; });
    if (customBlockImport === undefined)
        return customBlocks;
    var tag = customBlockImport.alias || customBlockImport.name;
    var customBlockTokens = literalTokens.filter(function (lit) { return lit.tag === tag; });
    for (var _i = 0, customBlockTokens_1 = customBlockTokens; _i < customBlockTokens_1.length; _i++) {
        var _b = customBlockTokens_1[_i], body = _b.body, start = _b.start, end = _b.end;
        var normalizedCustomBlock = utils_1.normalizeCustomBlock({ content: body, start: start, end: end });
        customBlocks.push(normalizedCustomBlock);
    }
    return customBlocks;
}
function resolveStyleLiteralTag(_a) {
    var importToken = _a.importToken, literalTokens = _a.literalTokens;
    var isScoped = undefined;
    var styles = [];
    var styleImport = importToken.imports.find(function (imp) { return imp.name === "style"; });
    if (styleImport === undefined)
        return { isScoped: isScoped, styles: styles };
    var tag = styleImport.alias || styleImport.name;
    var styleTokens = literalTokens.filter(function (lit) { return lit.tag === tag; });
    for (var _i = 0, styleTokens_1 = styleTokens; _i < styleTokens_1.length; _i++) {
        var styleToken = styleTokens_1[_i];
        var normalizedStyle = utils_1.normalizeStyle(styleToken.body, styleToken.start, styleToken.end);
        if (normalizedStyle.scoped)
            isScoped = normalizedStyle.scoped;
        styles.push(normalizedStyle);
    }
    return {
        isScoped: isScoped,
        styles: styles
    };
}
function resolveTemplateLiteralTag(_a) {
    var importToken = _a.importToken, fatArrowTokens = _a.fatArrowTokens, literalTokens = _a.literalTokens, isScoped = _a.isScoped;
    return templateLiteralTagResolver({
        tagName: "template",
        importToken: importToken,
        fatArrowTokens: fatArrowTokens,
        literalTokens: literalTokens,
        isScoped: isScoped
    });
}
function resolveFatArrowTemplate(fatArrowLiteral) {
    var body = fatArrowLiteral.body ? fatArrowLiteral.body.text : "";
    var paramters = fatArrowLiteral.parameters;
    // If there are no parameters in the fat arrow template, throw an Error
    if (paramters.length === 0) {
        throw new Error("Vue Literal Compiler Error:\n" +
            "Fat Arrow Templates with no parameters (() => any) are not supported.\n" +
            "Either pass a single parameter using the fat arrow syntax or use a simple assignment template.\n" +
            "\nExamples of supported template signatures are:\n" +
            "1. template`...`\n" +
            "2. app => template`...`\n" +
            "3. (app) => template`...`\n" +
            "4. (app:App) => template`...`\n" +
            "\n- Fat Arrow Templates can only have one parameter which represents the instance of the Vue component.\n" +
            "- Only Fat Arrow Syntax is supported for functional templates\n\n");
    }
    if (fatArrowLiteral.body && fatArrowLiteral.body.text) {
        body = utils_1.resolveTemplateBindings(paramters[0], fatArrowLiteral.body.text);
    }
    return body;
}
function templateLiteralTagResolver(_a) {
    var tagName = _a.tagName, importToken = _a.importToken, fatArrowTokens = _a.fatArrowTokens, literalTokens = _a.literalTokens, isScoped = _a.isScoped, contentFilter = _a.contentFilter;
    var template = null;
    var templateImport = importToken.imports.find(function (imp) { return imp.name === tagName; });
    if (templateImport === undefined)
        return template;
    var tag = templateImport.alias || templateImport.name;
    // Determine if template tag is arrow function.
    var templateFatArrow = fatArrowTokens.find(function (t) { return t.tag === tag; });
    if (templateFatArrow) {
        var temp = resolveFatArrowTemplate(templateFatArrow);
        if (contentFilter)
            temp = contentFilter(temp);
        template = utils_1.normalizeTemplate(temp, templateFatArrow.start, templateFatArrow.end, isScoped);
        return template;
    }
    // Determine if template tag is just a literal string
    var templateLiteralString = literalTokens.find(function (t) { return t.tag === tag; });
    if (templateLiteralString) {
        if (contentFilter)
            templateLiteralString.body = contentFilter(templateLiteralString.body);
        template = utils_1.normalizeTemplate(templateLiteralString.body, templateLiteralString.start, templateLiteralString.end, isScoped);
        return template;
    }
    return template;
}
