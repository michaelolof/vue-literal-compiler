import { SFCDescriptor, SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
//@ts-ignore
import hyntax from "hyntax";

export interface Paddable {
  pad: "line" | "space",
}

const templateRegexp = /\/\*([\s\*]+)?@VueLiteralCompiler ([\s]+)?Template([\s]+)?\*\/([^`]+)?`[^`]+`/;
const functionalTemplateRegexp = /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Functional Template([\s]+)?\*\/([^`]+)?`[^`]+`/;
const stylesRegexp = /\/\*\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Styles([\s\*]+)?\*\/([^`]+)?`[^`]+`/;
const customBlocksRegexp = /\/\*([\s\*]+)?@VueLiteralCompiler([\s]+)?Custom Block([\s]+)?\*\/([^`]+)?`[^`]+`/g;

const langAttrRegexp = /lang=[\'\"]([a-z]+:?)[\'\"]/;

export function parseComponent(file:string, options:Paddable = { pad: "line"}):SFCDescriptor {
  let isScoped:boolean|undefined = undefined;
  let styles:SFCBlock[] = []
  let template:SFCBlock|null = null;
  let customBlocks:SFCCustomBlock[] = [];
  let script: SFCBlock|null;

  const stylesReplacement = findAndReplaceDirective( file, stylesRegexp );
  file = stylesReplacement.modified;
  if( stylesReplacement.matches.length ) {
    const n = normalizeStyles( stylesReplacement.matches[0].content, stylesReplacement.matches[0].start );
    styles = n.styles;
    isScoped = n.isScoped;
  }
  
  let templateReplacement = findAndReplaceDirective( file, templateRegexp );
  // Check for normal template
  if( templateReplacement.matches.length ) {
    template = normalizeTemplate( templateReplacement.matches[0].content, templateReplacement.matches[0].start, templateReplacement.matches[0].end, isScoped )
  } else {
    // Check for functional template
    templateReplacement = findAndReplaceFunctionalTemplate( file, functionalTemplateRegexp );
    if( templateReplacement.matches.length ) {
      template = normalizeTemplate( templateReplacement.matches[0].content, templateReplacement.matches[0].start, templateReplacement.matches[0].end, isScoped )
    }
  }
  file = templateReplacement.modified;
  
  const custBlocksReplacement = findAndReplaceDirective( file, customBlocksRegexp );
  file = custBlocksReplacement.modified;
  if( custBlocksReplacement.matches.length ) {
    customBlocks = normalizeCustomBlocks( custBlocksReplacement.matches );
  }

  script = normalizeScripts( file );

  return {
    template,
    script,
    styles,
    customBlocks,
  }
  // throw new Error('Code Block Not Implemented Yet.').stack;
}


function normalizeScripts(modifiedFile:string):SFCBlock {
  return {
    type: "script",
    content: modifiedFile,
    lang: "ts", // Hard code a default to ts right now. Will be modified.
    attrs: { lang: "ts" },
    start: 0, // Pass in an abitrary number.
    end: modifiedFile.length // Pass in an arbitraty number.
  }
}

function normalizeCustomBlocks(customBlocksDeclartion:Match[]) {
  return customBlocksDeclartion.map( c => normalize( c ) );

  function normalize(customBlock:Match):SFCCustomBlock {
    let type = "";
    const attrs:Record<any, any> = {};
    const customBlockTypeRegex = /<(([\s]+)?[^>]+:?)>/
    const headerless = customBlock.content.replace( customBlockTypeRegex, (match, ...args) => {
      const inner = args[0] as string;
      type = inner.replace( langAttrRegexp, (_, ...args) => {
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

function normalizeTemplate(templateMarkup:string, start:number, end:number, isScoped:true|undefined):SFCBlock|null {
  const { content, attrs } = removeTemplateTagIfAny( templateMarkup );
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


  function removeTemplateTagIfAny( templateMarkup:string ) {
    const attrs:Record<any,any> = {};
    
    const templateHeaderRegexp = /(<([\s]+)?template(([\s]+:?))?([^>]+)?>)|<\/([\s]+)?template([\s]+)?>/g
    let templateAttrs = "";
    const content = templateMarkup.replace( templateHeaderRegexp, (match, ...args) => {
      if( args[4] ) templateAttrs = args[4] as string;
      return "";
    });
    if( templateAttrs ) {
      const m = templateAttrs.match( langAttrRegexp );
      if( m ) attrs.lang = m[1];
    }
    return {
      attrs,
      content,
    }
  }
}


function normalizeStyles(stylesWithTags:string, start:number ):NormalizedStyles {
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
    const styleMatch = styleHeader.match(langAttrRegexp);
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

function findAndReplaceFunctionalTemplate(file:string, rgx:RegExp): Replacement {
  let matches:Match[] = [], start = 0, end = 0;  
  const variableMatcher = /\${([^}]+:?)}/;

  const modified = file.replace( rgx, (found, ...args) => {
    if( !found.length ) return "undefined";
    const fatArrowString = args[ 3 ] as string;
    const paramBlk = fatArrowString.split("=>")[0].split(":")[0].split("(");
    const param = paramBlk[ paramBlk.length - 1 ].trim();
    let content = removeDirective( found );
    start = args[4];
    end = found.length + start - 1;
    const contentToken = hyntax.tokenize( content ).tokens as HyntaxToken[];
    const variableTokens = fetchVariableTokens( contentToken, variableMatcher );
    const dd = variableTokens.map( vtoken => resolveContent( vtoken, param, variableMatcher ) );
    dd.map( d => { 
      content = replaceContentAtPosition( content, d.orignal, d.replaced )
    })
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
      const resolvedDeclaration = declaration.replace( paramCallRegx, "" );
      if( token.type === "token:text" ) return `{{ ${resolvedDeclaration} }}`
      else return resolvedDeclaration.trim();
    });
    return {
      orignal: token,
      replaced,
    }
  }
}

function findAndReplaceDirective(file:string, rgx:RegExp):Replacement {
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

