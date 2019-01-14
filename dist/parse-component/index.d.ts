import { SFCDescriptor } from "@vue/component-compiler-utils/dist/parse";
export interface Paddable {
    pad: "line" | "space";
}
export declare function parseComponent(fileContent: string, options?: Paddable): SFCDescriptor;
