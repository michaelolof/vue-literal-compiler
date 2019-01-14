import { SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
export declare const regexp: {
    template: RegExp;
    styles: RegExp;
    customBlock: RegExp;
    langAttr: RegExp;
};
export declare function replaceMatchedDirective(file: string, rgx: RegExp): Replacement;
export declare function replaceMatchedTemplateDirective(file: string, rgx: RegExp): Replacement;
export declare function normalizeStyles(stylesWithTags: string, start: number): NormalizedStyles;
export declare function normalizeTemplate(templateMarkup: string, start: number, end: number, isScoped: true | undefined): SFCBlock | null;
export declare function normalizeCustomBlocks(customBlocksDeclartion: Match[]): SFCCustomBlock[];
export declare function normalizeScripts(modifiedFile: string): SFCBlock;
export interface Replacement {
    matches: Match[];
    modified: string;
}
export interface Match {
    content: string;
    start: number;
    end: number;
}
export interface NormalizedStyles {
    isScoped: true | undefined;
    styles: SFCBlock[];
}
