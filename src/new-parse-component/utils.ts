//@ts-ignore 
import hyntax from "hyntax";
import { SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
import { split, first, last, pipe } from "../utils";


export const regexp = {
  template: /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Template([^`]+)?`[^`]+`([\s]+)?;?/,
  styles: /\/\*\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Styles([\s\*]+)?\*\/([^`]+)?`[^`]+`([\s]+)?;?/g,
  customBlock: /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Custom Block([\s]+)?\*\/([^`]+)?`[^`]+`([\s]+)?;?/g,
  langAttr: /lang=[\'\"]([a-z]+:?)[\'\"]/,
}

export function matchJSDocDirective(fileContent:string, rgx:RegExp) {
  let matches:MatchedDeclaration[] = [];

  let regexpArr:RegExpExecArray;
  //@ts-ignore
  while((regexpArr = rgx.exec( fileContent )) !== null ) {
    const match = regexpArr[0];
    const content = getBacktildesContent( match );
    const start = regexpArr.index;
    const end = start + match.length;
    matches.push({ content, start, end });   
  }
  
  return matches
}


export function resolveTemplateBindings( parameter :string, fatArrowBody :string ) {
  const variableMatcher = /\${([^}]+:?)}/;
  
  const contentToken = hyntax.tokenize( fatArrowBody ).tokens as HyntaxToken[];
  const variableTokens = fetchVariableTokens( contentToken, variableMatcher );
  const dd = variableTokens.map( vtoken => resolveContent( vtoken, parameter, variableMatcher ) );
  dd.map( d => fatArrowBody = replaceContentAtPosition( fatArrowBody, d.orignal, d.replaced ));

  return fatArrowBody;
  //-------------------------------------------------------------------
  function fetchVariableTokens( tokens:HyntaxToken[], variableMatcher:RegExp ) {
    const variableTokens:HyntaxToken[] = [];
    for(let token of tokens ) {
      switch( token.type ) {
        case "token:text":
          const cd = token.content.match( variableMatcher );
          if( cd === null ) break;
          variableTokens.push( token );
          break;
        case "token:attribute-value":
          const cd2 = token.content.match( variableMatcher );
          if( cd2 === null ) break;
          variableTokens.push( token );
          break;
        default: break;
      }
    }
    return variableTokens;
  }

  function resolveContent(token:HyntaxToken, param:string, variableMatcher:RegExp):ResolvedLiteral {
    const replaced = token.content.replace( variableMatcher, (match, ...args ) => {
      let declaration = args[ 0 ] as string;
      // Remove the any <any> type cast.
      declaration = declaration.replace("<any>", "" )
      const paramCallRegx = new RegExp( param + "([\s]+)?.")
      const resolvedDeclaration = declaration.split(" ").map( d => d.replace( paramCallRegx, "" ) ).join(" ");
      if( token.type === "token:text" ) return `{{ ${resolvedDeclaration} }}`
      else return resolvedDeclaration.trim();
    });
    return {
      orignal: token,
      replaced,
    }
  }

  function replaceContentAtPosition(content:string, token:HyntaxToken, replaced:string) {
    return content.replace( token.content, replaced );
  }

}

export function matchJSDocTemplateDirective(fileContent:string, rgx:RegExp) {
  let matches:MatchedDeclaration[] = [], start = 0, end = 0;
  
  const regexpArr = rgx.exec( fileContent );
  
  if( regexpArr === null ) return matches;
  const match = regexpArr[0];
  start = regexpArr.index;
  end = start + match.length;
  let content = getBacktildesContent( match );

  const assignmentStatement = regexpArr[ regexpArr.length - 2 ];
  if( templateIsFunctional( assignmentStatement ) ) {
    const variableMatcher = /\${([^}]+:?)}/;
    const param = getParameter( assignmentStatement );
    if( param.length === 0 ) {
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
    const contentToken = hyntax.tokenize( content ).tokens as HyntaxToken[];
    const variableTokens = fetchVariableTokens( contentToken, variableMatcher );
    const dd = variableTokens.map( vtoken => resolveContent( vtoken, param, variableMatcher ) );
    dd.map( d => content = replaceContentAtPosition( content, d.orignal, d.replaced ));
  }

  matches.push({ content, start, end });
  return matches;
  //-------------------------------------------------------- 
  function getParameter (assignmentStatement:string) {
    const pipeParameter = pipe<string, string>(  
      split( "=>" ),
      first,
      split( "=" ),
      last,
      split( ":" ),
      first,
      split( "(" ),
      last,
      split( ")" ),
      first,
    );
    return pipeParameter( assignmentStatement );
  }

  function templateIsFunctional(assignmentStatement:string) {
    return assignmentStatement.indexOf("=>") > -1
  }

  function replaceContentAtPosition(content:string, token:HyntaxToken, replaced:string) {
    return content.replace( token.content, replaced );
  }

  function fetchVariableTokens( tokens:HyntaxToken[], variableMatcher:RegExp ) {
    const variableTokens:HyntaxToken[] = [];
    for(let token of tokens ) {
      switch( token.type ) {
        case "token:text":
          const cd = token.content.match( variableMatcher );
          if( cd === null ) break;
          variableTokens.push( token );
          break;
        case "token:attribute-value":
          const cd2 = token.content.match( variableMatcher );
          if( cd2 === null ) break;
          variableTokens.push( token );
          break;
        default: break;
      }
    }
    return variableTokens;
  }

  function resolveContent(token:HyntaxToken, param:string, variableMatcher:RegExp):ResolvedLiteral {
    const replaced = token.content.replace( variableMatcher, (match, ...args ) => {
      let declaration = args[ 0 ] as string;
      // Remove the any <any> type cast.
      declaration = declaration.replace("<any>", "" )
      const paramCallRegx = new RegExp( param + "([\s]+)?.")
      const resolvedDeclaration = declaration.split(" ").map( d => d.replace( paramCallRegx, "" ) ).join(" ");
      if( token.type === "token:text" ) return `{{ ${resolvedDeclaration} }}`
      else return resolvedDeclaration.trim();
    });
    return {
      orignal: token,
      replaced,
    }
  }
}


export function normalizeStyle( styleWithHeader:string, start:number, end :number ):SFCBlock {

  let content :string = "";
  let attrs = {} as Record<string,any>;
  let lang :string = "";
  let scoped :true | undefined = undefined;
  let styleHeader = "";

  // Remove ending style tag to avoid match dupication.
  styleWithHeader = styleWithHeader.trimRight().replace(/<\/([\s]+)?style([\s]+)?>/g, "" );

  const styleHeaderRegexp = /<([^>]+)?>/g
  content = styleWithHeader.replace( styleHeaderRegexp, (match, ...args) => {
    styleHeader = args[ 0 ];
    return "" 
  });

  // Check for scoped styles
  if( styleHeader.indexOf( "scoped" ) > -1 ) {
    scoped = true;
    attrs.scoped = true;
  }
  const styleMatch = styleHeader.match(regexp.langAttr);
  if( styleMatch ) {
    lang = styleMatch[ 1 ];
    attrs.lang = lang
  }

  return {
    type: "style",
    content,
    scoped,
    lang,
    start,
    end,
    attrs,
    src: undefined,
    map: undefined,
    module: undefined,
  }
}

export function _normalizeStyle(styleWithHeader:string, start:number ):SFCBlock {

  let lang:string|undefined = undefined;
  let scoped:true|undefined = undefined;
  const attrs:Record<any, any> = {};


  const styleHeaderRegexp = /<([^>]+)?>/g
  let styleHeader = "", compStart = 0, compEnd = 0;

  const styleDeclaration = styleWithHeader.replace( styleHeaderRegexp, (match, ...args) => {
    compStart = args[ 1 ] + start;
    compEnd = compStart + styleWithHeader.length;
    styleHeader = match;

    return "" 
  });

  // Check for scoped styles
  if( styleHeader.indexOf( "scoped" ) > -1 ) {
    scoped = true;
    attrs.scoped = true;
  }
  const styleMatch = styleHeader.match(regexp.langAttr);
  if( styleMatch ) {
    lang = styleMatch[ 1 ];
    attrs.lang = lang
  }

  return {
    type: "style",
    content: styleDeclaration,
    scoped,
    lang,
    start: compStart,
    end: compEnd,
    attrs,
    src: undefined,
    map: undefined,
    module: undefined,
  }
  
}

interface NormalizeCustomTemplateOptions {
  templateMarkup :string;
  start :number;
  end :number;
  lang :string;
  isScoped :true | undefined;
}


export function normalizeCustomTemplate({ templateMarkup, start, end, lang, isScoped } :NormalizeCustomTemplateOptions ) {
  return {
    type: "template",
    // attribute :
  }
}

export function normalizeTemplate(templateMarkup:string, start:number, end:number, isScoped:true|undefined):SFCBlock|null {
  const { content, attrs } = removeWrappingTemplateTagsIfAny( templateMarkup, start, end );
  return {
    type: "template",
    attrs,
    content,
    start,
    end,
    scoped: isScoped,
    lang: attrs.lang,
    map: undefined,
    module: undefined,
    src: undefined,
  };

  function removeWrappingTemplateTagsIfAny( templateMarkup:string, start:number, end:number ) {
    const attrs:Record<any, any> = {}
    templateMarkup = templateMarkup.trim();
    if( templateMarkup.length === 0 ) return { content: "", attrs }
    const firstTagRegexp = /<((.|\n)*?):?>/;
    const firstTagRegexpArr = templateMarkup.match( firstTagRegexp );
    if( firstTagRegexpArr === null ) {
      // markup has no initail tag name.
      throw new Error(
        "\n<template> tag not found.\n" +
        "Usage of template tag is only optional if you're writing html.\n" +
        "Are you trying to use a different template lang like pug or jade?\n" +
        "If so specify the template language you're using:\n" +
        "Example:\n" + 
        "<template lang=\"jade\">\n" +
        "...\n" +
        "</template>" 
      );
    } else {
      const tagString = firstTagRegexpArr[1];
      const tagName = tagString.split(" ")[0];
      if( tagName === "template" ) {
        const match = firstTagRegexpArr[0];
        // Remove opening tag
        let tempArr = templateMarkup.split( match );
        tempArr.shift();
        templateMarkup = tempArr.join( match );
      
        // Remove closing template tag.
        tempArr = templateMarkup.split("</");
        tempArr.pop();
        templateMarkup = tempArr.join("</");

        // Check template header for lang attribute.
        const langAttrMatched = tagString.match( regexp.langAttr );
        if( langAttrMatched ) attrs.lang = langAttrMatched[1];

        // Check template header for functional attribute.
        if( tagString.indexOf("functional") > -1 ) attrs.functional = true;
      }

      return {
        content: templateMarkup,
        attrs,
      }
    }
  }
}

export function normalizeCustomBlock({ content, start, end } :MatchedDeclaration ):SFCCustomBlock {
    let type = "";
    const attrs:Record<any, any> = {};
    const customBlockTypeRegex = /<(([\s]+)?[^>]+:?)>/
    const headerless = content.replace( customBlockTypeRegex, (match, ...args) => {
      const inner = args[0] as string;
      type = inner.replace( regexp.langAttr, (_, ...args) => {
        attrs.lang = args[0]
        return ""
      });
      return ""
    })
    
    const endRegexp = new RegExp("<\/([\s]+)?"+type.trim()+"([\s]+)?>");
    const customBlockContent = headerless.replace( endRegexp, "" );
    return  {
      content: customBlockContent,
      attrs,
      type,
      start,
      end,
      map: undefined,
    }
}

export function normalizeScript(modifiedFile:string):SFCBlock {
  return {
    type: "script",
    content: modifiedFile,
    lang: "ts", // Hard code a default to 'ts' right now. Will be modified later.
    attrs: { lang: "ts" },
    start: 0, // Pass in an abitrary number.
    end: modifiedFile.length // Pass in an arbitraty number.
  }
}

function getBacktildesContent(match:string) {
  const startLiteralIndex = match.indexOf("`");
  const endDirective = match.indexOf("`", startLiteralIndex+1 );
  return match.slice( startLiteralIndex + 1, endDirective );
}

export interface LiteralMatch {
  matches:MatchedDeclaration[];
  modified:string;
}

export interface MatchedDeclaration {
  content:string;
  start:number;
  end:number;
}

export interface NormalizedStyles {
  isScoped:true|undefined;
  styles:SFCBlock[];
  start:number,
  end:number,
}

interface HyntaxToken {
  type:"token:text"|"token:close-tag"|"token:open-tag-end"|"token:open-tag-start"|"token:attribute-value";
  content:string;
  startPosition:number;
  endPosition:number;
}

interface ResolvedLiteral {
  orignal:HyntaxToken;
  replaced:string;
}

export interface DeclarationsArePresent {
  template: SFCBlock | null;
  styles: SFCBlock[];
  customBlocks: SFCCustomBlock[];
}

export function removeDeclarations( fileContent:string, { template, styles, customBlocks } :DeclarationsArePresent ) {
  let templateMatch, styleMatches :string[] = [], customBlockMatches :string[] = [];
  if( template ) templateMatch = fileContent.substring( template.start, template.end )
  if( styles.length > 0 ) styleMatches =  styles.map( style => fileContent.substring( style.start, style.end ) );
  if( customBlocks.length > 0 ) customBlockMatches = customBlocks.map( custom => fileContent.substring( custom.start, custom.end ) );
  
  if( templateMatch ) fileContent = fileContent.replace( templateMatch, "" );
  for( let style of styleMatches ) fileContent = fileContent.replace( style, "" );
  for( let block of customBlockMatches ) fileContent = fileContent.replace( block, "" );

  return fileContent;
}
