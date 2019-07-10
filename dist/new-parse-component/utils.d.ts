import { SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
import { ImportDeclaration, ArrowFunction, TaggedTemplateExpression } from "typescript";
export declare const regexp: {
    langAttr: RegExp;
};
export declare function tokenizeContent(fileContent: string): (ImportDefinition | TaggedLiteral | FatArrowLiteral)[];
export declare function removeDeclarations(fileContent: string, { template, styles, customBlocks }: DeclarationsArePresent): string;
export declare function resolveTemplateBindings(parameter: string, fatArrowBody: string): string;
export declare function normalizeStyle(styleWithHeader: string, start: number, end: number): SFCBlock;
export declare function normalizeTemplate(templateMarkup: string, start: number, end: number, isScoped: true | undefined): SFCBlock | null;
export declare function normalizeCustomBlock({ content, start, end }: MatchedDeclaration): SFCCustomBlock;
export declare function normalizeScript(modifiedFile: string): SFCBlock;
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
export declare class TaggedLiteral {
    private _tag;
    body: string;
    start: number;
    end: number;
    isFunctional: boolean;
    constructor(node: TaggedTemplateExpression);
    readonly tag: string;
}
export declare class ImportDefinition {
    start: number;
    end: number;
    module: string;
    imports: {
        name: string;
        alias?: string;
    }[];
    constructor(node: ImportDeclaration);
}
export declare class FatArrowLiteral {
    start: number;
    end: number;
    tag: string;
    body: {
        text: string;
        start: number;
        end: number;
    } | undefined;
    parameters: string[];
    isFunctional: boolean;
    constructor(node: HasTag & ArrowFunction, fileContent: string);
}
export interface DeclarationsArePresent {
    template: SFCBlock | null;
    styles: SFCBlock[];
    customBlocks: SFCCustomBlock[];
}
interface HasTag {
    node: {
        body: {
            tag: {
                escapedText: string;
            };
        };
        template: {
            text: string;
            post: number;
            end: number;
        };
    };
}
export {};
