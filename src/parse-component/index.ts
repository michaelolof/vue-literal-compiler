import { SFCDescriptor, SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
import { 
  regexp, 
  replaceMatchedDirective, 
  replaceMatchedTemplateDirective, 
  normalizeStyles,
  normalizeTemplate,
  normalizeCustomBlocks,
  normalizeScripts,
} from "./utils";

export interface Paddable {
  pad: "line" | "space",
}


export function parseComponent(fileContent:string, options:Paddable = { pad: "line"}):SFCDescriptor {
  let isScoped:boolean|undefined = undefined;
  let styles:SFCBlock[] = []
  let template:SFCBlock|null = null;
  let customBlocks:SFCCustomBlock[] = [];
  let script: SFCBlock|null;

  const { modified: contentWithoutStyles, matches: styleMatches } = replaceMatchedDirective( fileContent, regexp.styles );
  if( styleMatches.length ) {
    const normalizedStyles = normalizeStyles( styleMatches[0].content, styleMatches[0].start );
    styles = normalizedStyles.styles;
    isScoped = normalizedStyles.isScoped;
  }
  
  const { modified: contentWithoutTemplate, matches: templateMatches } = replaceMatchedTemplateDirective( contentWithoutStyles, regexp.template );
  if( templateMatches.length ) {
    template = normalizeTemplate( templateMatches[0].content, templateMatches[0].start, templateMatches[0].end, isScoped )
  }
  
  const { modified: contentWithoutCustomBlocks, matches: customMatches } = replaceMatchedDirective( contentWithoutTemplate, regexp.customBlock );
  if( customMatches.length ) {
    customBlocks = normalizeCustomBlocks( customMatches );
  }

  script = normalizeScripts( contentWithoutCustomBlocks );

  return {
    template,
    script,
    styles,
    customBlocks,
  }

}