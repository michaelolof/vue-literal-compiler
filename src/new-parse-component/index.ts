import { SFCDescriptor, SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
import { tokenizeContent, resolveTemplateBindings, normalizeTemplate, normalizeStyle, normalizeCustomBlock, removeDeclarations, normalizeScript, ImportDefinition, FatArrowLiteral, TaggedLiteral } from "./utils";
import { parseComponentUsingComments } from "../parse-component/index";

// const moduleName = "vue-literal-compiler/tags";
const moduleName = "../utils";

export function parseComponent(fileContent :string, options :Paddable = { pad: "line"}) :SFCDescriptor {

  let styles :SFCBlock[] = []
  let template :SFCBlock | null = null;
  let customBlocks :SFCCustomBlock[] = [];
  let script :SFCBlock | null = null;

  const tokens = tokenizeContent( fileContent );

  // If there are no import, literal or fat arrow tokens parse using comments.
  if( tokens === undefined ) return parseComponentUsingComments( fileContent, options );

  // Look for import definitions using this library.
  const importToken = tokens.find( token => token instanceof ImportDefinition && token.module === moduleName ) as ImportDefinition | undefined;

  // If there are no import tokens using vue-literal-compiler default to using comments.
  if( importToken === undefined ) return parseComponentUsingComments( fileContent, options );

  // Extract literal and fatarrow tokens.
  const fatArrowTokens = tokens.filter( t => t instanceof FatArrowLiteral ) as FatArrowLiteral[];
  const literalTokens = tokens.filter( t => t instanceof TaggedLiteral ) as TaggedLiteral[];

  // Handle Style Tags.
  const resolvedStyle = resolveStyleLiteralTag({ importToken, literalTokens });
  const isScoped = resolvedStyle.isScoped;
  styles = resolvedStyle.styles;

  // Handle Template Tags.
  template = resolveTemplateLiteralTag({ importToken, fatArrowTokens, literalTokens, isScoped });

  // Handle Custom Blocks
  customBlocks = resolveCustomBlocks({ importToken, literalTokens });

  // Remove all template, styles and custom blocks
  const scriptsOnly = removeDeclarations( fileContent, {
    template,
    styles,
    customBlocks
  });

  // Handle Script.
  script = normalizeScript( scriptsOnly )

  console.log( template );

  return {
    template,
    script,
    styles,
    customBlocks
  };

}

function resolveCustomBlocks({ importToken, literalTokens } :CustomBlockOptions ) {
  let customBlocks :SFCCustomBlock[] = [];

  const customBlockImport = importToken.imports.find( imp => imp.name === "customBlock" );

  if( customBlockImport === undefined ) return customBlocks;

  const tag = customBlockImport.alias || customBlockImport.name;

  const customBlockTokens = literalTokens.filter( lit => lit.tag === tag );

  for( let { body, start, end } of customBlockTokens ) {
    const normalizedCustomBlock = normalizeCustomBlock({ content: body, start, end });
    customBlocks.push( normalizedCustomBlock );
  }

  return customBlocks;
}

function resolveStyleLiteralTag({ importToken, literalTokens } :StyleLiteralTagsOptions ) :{ isScoped :true | undefined, styles :SFCBlock[] } {
  let isScoped :true | undefined = undefined;
  let styles :SFCBlock[] = [];

  const styleImport = importToken.imports.find( imp => imp.name === "style" );

  if( styleImport === undefined ) return { isScoped, styles };

  const tag = styleImport.alias || styleImport.name;

  const styleTokens = literalTokens.filter( lit => lit.tag === tag );


  for( let styleToken of styleTokens ) {
    const normalizedStyle = normalizeStyle( styleToken.body, styleToken.start, styleToken.end );
    if( normalizedStyle.scoped ) isScoped = normalizedStyle.scoped;
    styles.push( normalizedStyle );
  }

  return {
    isScoped,
    styles
  }

}

function resolveTemplateLiteralTag({ importToken, fatArrowTokens, literalTokens, isScoped } :TemplateLiteralOptions) {

  return templateLiteralTagResolver({ 
    tagName: "template",
    importToken, 
    fatArrowTokens, 
    literalTokens, 
    isScoped 
  })

}

function resolveFatArrowTemplate( fatArrowLiteral :FatArrowLiteral ) {
  let body = fatArrowLiteral.body ? fatArrowLiteral.body.text : "";
  const paramters = fatArrowLiteral.parameters;
  
  // If there are no parameters in the fat arrow template, throw an Error
  if( paramters.length === 0 ) {
    throw new Error(
      "Vue Literal Compiler Error:\n"+
      "Fat Arrow Templates with no parameters (() => any) are not supported.\n" +
      "Either pass a single parameter using the fat arrow syntax or use a simple assignment template.\n" + 
      "\nExamples of supported template signatures are:\n" +
      "1. template`...`\n" +
      "2. app => template`...`\n" +
      "3. (app) => template`...`\n" +
      "4. (app:App) => template`...`\n" +
      "\n- Fat Arrow Templates can only have one parameter which represents the instance of the Vue component.\n" +
      "- Only Fat Arrow Syntax is supported for functional templates\n\n" 
    );
  }

  if( fatArrowLiteral.body && fatArrowLiteral.body.text ) {
    body = resolveTemplateBindings( paramters[ 0 ], fatArrowLiteral.body.text );
  }
  
  return body;
  
}


function templateLiteralTagResolver({ tagName, importToken, fatArrowTokens, literalTokens, isScoped, contentFilter } :TemplateResolverOptions ) {
  let template :SFCBlock | null = null;
  
  const templateImport = importToken.imports.find( imp => imp.name === tagName );
  
  if( templateImport === undefined ) return template;

  const tag = templateImport.alias || templateImport.name;
  
  // Determine if template tag is arrow function.
  const templateFatArrow = fatArrowTokens.find( t => t.tag === tag );
  if( templateFatArrow ) {
    let temp = resolveFatArrowTemplate( templateFatArrow );
    if( contentFilter ) temp = contentFilter( temp );
    template = normalizeTemplate( temp, templateFatArrow.start, templateFatArrow.end, isScoped );
    return template;
  }

  // Determine if template tag is just a literal string
  const templateLiteralString = literalTokens.find( t => t.tag === tag );
  if( templateLiteralString ) {
    if( contentFilter ) templateLiteralString.body = contentFilter( templateLiteralString.body );
    template = normalizeTemplate( 
      templateLiteralString.body, 
      templateLiteralString.start, 
      templateLiteralString.end, 
      isScoped  
    );
    return template;
  }

  return template;

}

interface CustomTemplateLiteralOptions extends TemplateLiteralOptions {
  tagName :string;
}

interface TemplateResolverOptions extends CustomTemplateLiteralOptions {
  contentFilter ?:( content :string ) => string;
}

interface TemplateLiteralOptions extends StyleLiteralTagsOptions {
  isScoped :true | undefined;
  fatArrowTokens :FatArrowLiteral[];
}

interface StyleLiteralTagsOptions {
  importToken :ImportDefinition;
  literalTokens :TaggedLiteral[];  
}

interface CustomBlockOptions extends StyleLiteralTagsOptions {}

export interface Paddable {
  pad: "line" | "space",
}

