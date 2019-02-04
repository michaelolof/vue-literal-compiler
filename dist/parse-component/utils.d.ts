import { SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
export declare const regexp: {
    template: RegExp;
    styles: RegExp;
    customBlock: RegExp;
    langAttr: RegExp;
};
export declare function matchJSDocDirective(fileContent: string, rgx: RegExp): MatchedDeclaration[];
export declare function matchJSDocTemplateDirective(fileContent: string, rgx: RegExp): MatchedDeclaration[];
export declare function normalizeStyles(stylesWithTags: string, start: number, end: number): NormalizedStyles;
export declare function normalizeTemplate(templateMarkup: string, start: number, end: number, isScoped: true | undefined): SFCBlock | null;
export declare function normalizeCustomBlocks(customBlocksDeclartion: MatchedDeclaration[]): SFCCustomBlock[];
export declare function normalizeScripts(modifiedFile: string): SFCBlock;
export interface LiteralMatch {
    matches: MatchedDeclaration[];
    modified: string;
}
export interface MatchedDeclaration {
    content: string;
    start: number;
    end: number;
}
export interface NormalizedStyles {
    isScoped: true | undefined;
    styles: SFCBlock[];
    start: number;
    end: number;
}
export interface DeclarationsArePresent {
    template: boolean;
    styles: boolean;
    customBlock: boolean;
}
export declare function removeDeclarations(str: string, isPresent: DeclarationsArePresent): string;
