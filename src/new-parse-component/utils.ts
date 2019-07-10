//@ts-ignore 
import hyntax from "hyntax";
import { SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
import { isArrowFunction, isImportDeclaration, isTaggedTemplateExpression,  forEachChild, SourceFile, Node, LeftHandSideExpression, ImportDeclaration, ArrowFunction, TaggedTemplateExpression, SyntaxKind, ScriptTarget, createSourceFile } from "typescript";

export const regexp = {
  langAttr: /lang=[\'\"]([a-z]+:?)[\'\"]/,
}

export function tokenizeContent( fileContent :string ) {

  const source = createSourceFile( "vue.lit.ts", fileContent, ScriptTarget.Latest );

  const arrs :(ImportDefinition | TaggedLiteral | FatArrowLiteral)[] = [];

  function callback( node :Node ) {
    
    switch( node.kind ) {
      case SyntaxKind.ImportDeclaration:
        //@ts-ignore
        return arrs.push( new ImportDefinition( node ) )
      case SyntaxKind.TaggedTemplateExpression:
        //@ts-ignore
        return arrs.push( new TaggedLiteral( node ) )
      case SyntaxKind.ArrowFunction:
        //@ts-ignore
        return arrs.push( new FatArrowLiteral( node, fileContent ) )
    }
    
  }; 

  function iterator(sourceFile: SourceFile | Node) {
    sourceFile.forEachChild(childNode => {
      // Only a class can use a decorator. So we search for classes.
      callback(childNode)
      iterator(childNode);
    });
  }

  iterator( source );

  return arrs;
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
    
    // Replace ${
    let replaced = token.content;
    const openLiteralCurlyBracesPosition = token.content.indexOf("${");
    if( openLiteralCurlyBracesPosition > -1 ) {
      
      const closingLiteralCurlyBracesPosition = replaced.lastIndexOf("} ");
      
      if( token.type === "token:text" ) {
        replaced = replaceAtPosition( replaced, openLiteralCurlyBracesPosition, "{" );
        replaced = replaceAtPosition( replaced, openLiteralCurlyBracesPosition, "{" );  
        replaced = replaceAtPosition( replaced, closingLiteralCurlyBracesPosition, "}}" ); 
      } 
      else {
        replaced = replaceAtPosition( replaced, openLiteralCurlyBracesPosition, "" );
        replaced = replaceAtPosition( replaced, openLiteralCurlyBracesPosition, "" );
        replaced = replaceAtPosition( replaced, closingLiteralCurlyBracesPosition, "" ); 
      }
      
      
      replaced = replaced.replace("<any>", "" )
      const paramCallRegx = new RegExp( param + "([\s]+)?.")
      const resolvedDeclaration = replaced.split(" ").map( d => d.replace( paramCallRegx, "" ) ).join(" ");
    
      // if( token.type === "token:text" ) replaced = `{{ ${resolvedDeclaration} }}`
      // else replaced = resolvedDeclaration.trim();
    }
    
    return {
      orignal: token,
      replaced,
    }
  }

  function replaceContentAtPosition(content:string, token:HyntaxToken, replaced:string) {
    return content.replace( token.content, replaced );
  }

  function replaceAtPosition(str :string, index :number, replace :string) {
    return str.substring(0, index) + replace + str.substring(index + 1);
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

export class TaggedLiteral {
  
  private _tag :LeftHandSideExpression & HasEscapedText;
  body :string;
  start :number;
  end :number;
  isFunctional = false;
  
  constructor( node :TaggedTemplateExpression ){
    //@ts-ignore
    this._tag = node.tag;
    //@ts-ignore
    this.body = node.template.text;
    this.start = node.pos;
    this.end = node.end;
  }

  get tag () {
    return this._tag.escapedText
  }

}

export class ImportDefinition {

  start :number;
  end :number;
  module :string;

  imports: {
    name :string;
    alias? :string;
  }[] = []

  constructor( node :ImportDeclaration ) {
    //@ts-ignore
    this.module = node.moduleSpecifier.text;
    this.start = node.pos;
    this.end = node.end;

    //@ts-ignore
    if( node.importClause && node.importClause.namedBindings && node.importClause.namedBindings.elements ) {
      //@ts-ignore
      const elements = node.importClause.namedBindings.elements;
      
      for( let element of elements ) {
            
        //@ts-ignore
        if( element.name && !element.propertyName ) {
          // Import does not have an alias
          this.imports.push({
            //@ts-ignore
            name: element.name.escapedText,
          })
        }
  
        else if( element.propertyName && element.name ) {
          // Import has an alias.
          this.imports.push({
            //@ts-ignore
            name: element.propertyName.escapedText,
            //@ts-ignore
            alias: element.name.escapedText
          })  
        }
      }

    }
  }
}

export class FatArrowLiteral {
  start :number;
  end :number;
  tag :string;
  body :{ text :string, start: number, end :number } | undefined = undefined;
  parameters: string[] = [];
  isFunctional = false;

  constructor( node :HasTag & ArrowFunction, fileContent :string ) {    
    this.start = node.pos;
    this.end = node.end;
    //@ts-ignore
    this.tag = node.body.tag.escapedText
    //@ts-ignore
    if( node.body.template ) {

      this.body = {
        //@ts-ignore
        text: fileContent.substring( node.body.template.pos + 1, node.body.template.end - 1 ),
        //@ts-ignore
        start: node.body.template.pos,
        //@ts-ignore
        end: node.body.template.end,
      } 
    }
    //@ts-ignore
    this.parameters = node.parameters.map( p => p.name.escapedText);
  }

}

export interface DeclarationsArePresent {
  template: SFCBlock | null;
  styles: SFCBlock[];
  customBlocks: SFCCustomBlock[];
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

interface HasEscapedText {
  escapedText :string;
}

interface HasTag {
  node: {
    body: {
      tag: { escapedText :string }
    },
    template: {
      text :string;
      post :number;
      end :number;
    }
  }
}
