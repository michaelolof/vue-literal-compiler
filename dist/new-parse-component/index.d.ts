import { SFCDescriptor } from "@vue/component-compiler-utils/dist/parse";
export declare function parseComponent(fileContent: string, options?: Paddable): SFCDescriptor;
export interface Paddable {
    pad: "line" | "space";
}
