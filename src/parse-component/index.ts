import { SFCDescriptor, SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
import { 
  regexp, 
  matchJSDocDirective, 
  matchJSDocTemplateDirective,
  normalizeStyles,
  normalizeTemplate,
  normalizeCustomBlocks,
  normalizeScripts,
  removeDeclarations,
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

  const styleMatches = matchJSDocDirective( fileContent, regexp.styles );
  if( styleMatches.length ) {
    const normalizedStyles = normalizeStyles( styleMatches[0].content, styleMatches[0].start, styleMatches[0].end );
    styles = normalizedStyles.styles;
    isScoped = normalizedStyles.isScoped;
  }
  
  const templateMatches = matchJSDocTemplateDirective( fileContent, regexp.template );
  if( templateMatches.length ) {
    template = normalizeTemplate( templateMatches[0].content, templateMatches[0].start, templateMatches[0].end, isScoped );
  }
  
  const customBlockMatches = matchJSDocDirective( fileContent, regexp.customBlock );
  if( customBlockMatches.length ) {
    customBlocks = normalizeCustomBlocks( customBlockMatches );
  }

  const scriptContent = removeDeclarations( fileContent, {
    template: templateMatches.length > 0,
    styles: styleMatches.length > 0,
    customBlock: customBlockMatches.length > 0,
  });

  script = normalizeScripts( scriptContent );

  return {
    template,
    script,
    styles,
    customBlocks,
  }

}


