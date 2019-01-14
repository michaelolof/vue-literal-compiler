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
    var _a = utils_1.replaceMatchedDirective(fileContent, utils_1.regexp.styles), contentWithoutStyles = _a.modified, styleMatches = _a.matches;
    if (styleMatches.length) {
        var normalizedStyles = utils_1.normalizeStyles(styleMatches[0].content, styleMatches[0].start);
        styles = normalizedStyles.styles;
        isScoped = normalizedStyles.isScoped;
    }
    var _b = utils_1.replaceMatchedTemplateDirective(contentWithoutStyles, utils_1.regexp.template), contentWithoutTemplate = _b.modified, templateMatches = _b.matches;
    if (templateMatches.length) {
        template = utils_1.normalizeTemplate(templateMatches[0].content, templateMatches[0].start, templateMatches[0].end, isScoped);
    }
    var _c = utils_1.replaceMatchedDirective(contentWithoutTemplate, utils_1.regexp.customBlock), contentWithoutCustomBlocks = _c.modified, customMatches = _c.matches;
    if (customMatches.length) {
        customBlocks = utils_1.normalizeCustomBlocks(customMatches);
    }
    script = utils_1.normalizeScripts(contentWithoutCustomBlocks);
    return {
        template: template,
        script: script,
        styles: styles,
        customBlocks: customBlocks,
    };
}
exports.parseComponent = parseComponent;
