import { SFCDescriptor } from "@vue/component-compiler-utils/dist/parse";
export interface Paddable {
    pad: "line" | "space";
}
export declare function parseComponent(file: string, options?: Paddable): SFCDescriptor;
