import { SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
//@ts-ignore
import hyntax from "hyntax";


export const regexp = {
  template: /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Template([\s]+)?\*\/([^`]+)?`[^`]+`/,
  styles: /\/\*\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Styles([\s\*]+)?\*\/([^`]+)?`[^`]+`/,
  customBlock: /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Custom Block([\s]+)?\*\/([^`]+)?`[^`]+`/g,
  
  langAttr: /lang=[\'\"]([a-z]+:?)[\'\"]/,
}

export function replaceMatchedDirective(file:string, rgx:RegExp):Replacement {
  let matches:Match[] = [];
  const modified = file.replace( rgx, (found, ...args) => {
    if( found.length ) {
      const match = ( removeDirective( found ) );
      const start = parseInt( args[5] );
      const end = start + found.length - 1;
      matches.push({
        content: match,
        start,
        end,
      })
    }
    return "";
  });
  return {
    matches,
    modified,
  }
}

export function replaceMatchedTemplateDirective(file:string, rgx:RegExp): Replacement {
  let matches:Match[] = [], start = 0, end = 0;  
  const variableMatcher = /\${([^}]+:?)}/;

  const modified = file.replace( rgx, (found, ...args) => {
    if( !found.length ) return "undefined";
    const assignmentStatement = args[ 3 ] as string;
    let content = removeDirective( found );
    start = args[4];
    end = found.length + start - 1;
    
    if( templateIsFunctional( assignmentStatement ) ) {
      const paramBlk = assignmentStatement.split("=>")[0].split("=")[1].split(":")[0].split("(");
      const param = paramBlk[ paramBlk.length - 1 ].split(")")[0].trim();
      if( param.length === 0 ) {
        throw new Error(
          "Vue Literal Compiler Error:\n"+
          "Functional Templates with no parameters (() => any) are not supported.\n" +
          "Either pass a single parameter using the fat arrow syntax or use a simple assignment template.\n" + 
          "\nExamples of supported template signatures are:\n" +
          "1. const template = `...`\n" +
          "2. const template = app => `...`\n" +
          "3. const template = (app) => `...`\n" +
          "4. const template = (app:App) => `...`\n" +
          "\n- A Functional template can only have one parameter which represents the instance of the Vue component.\n" +
          "- Only Fat Arrow Syntax is supported for functional templates\n\n" 
        );
      }
      
      const contentToken = hyntax.tokenize( content ).tokens as HyntaxToken[];
      const variableTokens = fetchVariableTokens( contentToken, variableMatcher );
      const dd = variableTokens.map( vtoken => resolveContent( vtoken, param, variableMatcher ) );
      dd.map( d => { 
        content = replaceContentAtPosition( content, d.orignal, d.replaced )
      })
    }

    matches.push({
      content,
      start,
      end
    })

    return "";
  })
    
  return {
    matches,
    modified,
  }

  //--------------------------------------------------------

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
      const declaration = args[ 0 ] as string;
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

export function normalizeStyles(stylesWithTags:string, start:number ):NormalizedStyles {
  let isScoped:true|undefined = undefined
  const stylesWithHeader = stylesWithTags.trimRight().split(/<\/([\s]+)?style([\s]+)?>/g).filter( v => v );
  const styles = stylesWithHeader.map( s => { 
    const n = normalizeStyle(s, start );
    if( n.scoped ) isScoped = true;
    start = n.end; // This tells the start index to begin at the end of the previous style;
    return n;
  });

  return {
    isScoped,
    styles
  }

  //-------------------------------------------------------------------------------------
  function normalizeStyle(styleWithHeader:string, start:number ):SFCBlock {
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

        const m = tagString.match( regexp.langAttr );
        if( m ) attrs.lang = m[1];
      }

      return {
        content: templateMarkup,
        attrs,
      }
    }
  }

}

export function normalizeCustomBlocks(customBlocksDeclartion:Match[]) {
  return customBlocksDeclartion.map( c => normalize( c ) );

  function normalize(customBlock:Match):SFCCustomBlock {
    let type = "";
    const attrs:Record<any, any> = {};
    const customBlockTypeRegex = /<(([\s]+)?[^>]+:?)>/
    const headerless = customBlock.content.replace( customBlockTypeRegex, (match, ...args) => {
      const inner = args[0] as string;
      type = inner.replace( regexp.langAttr, (_, ...args) => {
        attrs.lang = args[0]
        return ""
      });
      return ""
    })
    
    const endRegexp = new RegExp("<\/([\s]+)?"+type.trim()+"([\s]+)?>");
    const content = headerless.replace( endRegexp, "" );
    return  {
      content,
      attrs,
      type,
      start: customBlock.start,
      end: customBlock.end,
      map: undefined,
    }
  }
}

export function normalizeScripts(modifiedFile:string):SFCBlock {
  return {
    type: "script",
    content: modifiedFile,
    lang: "ts", // Hard code a default to ts right now. Will be modified.
    attrs: { lang: "ts" },
    start: 0, // Pass in an abitrary number.
    end: modifiedFile.length // Pass in an arbitraty number.
  }
}


function removeDirective(match:string) {
  const startLiteralIndex = match.indexOf("`");
  const endDirective = match.indexOf("`", startLiteralIndex+1 );
  return match.slice( startLiteralIndex+1, endDirective );
}

interface Replacement {
  matches:Match[];
  modified:string;
}

interface Match {
  content:string;
  start:number;
  end:number;
}

interface NormalizedStyles {
  isScoped:true|undefined;
  styles:SFCBlock[];
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

