"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
function parseComponent(fileContent, options) {
    if (options === void 0) { options = { pad: "line" }; }
    var isScoped = undefined;
    var styles = [];
    var template = null;
    var customBlocks = [];
    var script;
    var styleMatches = utils_1.matchJSDocDirective(fileContent, utils_1.regexp.styles);
    if (styleMatches.length) {
        var normalizedStyles = utils_1.normalizeStyles(styleMatches[0].content, styleMatches[0].start, styleMatches[0].end);
        styles = normalizedStyles.styles;
        isScoped = normalizedStyles.isScoped;
    }
    var templateMatches = utils_1.matchJSDocTemplateDirective(fileContent, utils_1.regexp.template);
    if (templateMatches.length) {
        template = utils_1.normalizeTemplate(templateMatches[0].content, templateMatches[0].start, templateMatches[0].end, isScoped);
    }
    var customBlockMatches = utils_1.matchJSDocDirective(fileContent, utils_1.regexp.customBlock);
    if (customBlockMatches.length) {
        customBlocks = utils_1.normalizeCustomBlocks(customBlockMatches);
    }
    var scriptContentOnly = utils_1.removeDeclarations(fileContent, {
        template: templateMatches.length > 0,
        styles: styleMatches.length > 0,
        customBlock: customBlockMatches.length > 0,
    });
    script = utils_1.normalizeScripts(scriptContentOnly);
    return {
        template: template,
        script: script,
        styles: styles,
        customBlocks: customBlocks,
    };
}
exports.parseComponent = parseComponent;
