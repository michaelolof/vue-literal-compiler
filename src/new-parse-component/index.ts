import { SFCDescriptor, SFCBlock, SFCCustomBlock } from "@vue/component-compiler-utils/dist/parse";
import { normalizeScripts } from "../parse-component/utils";
import { createSourceFile, ScriptTarget, SyntaxKind, SourceFile, Node, isTaggedTemplateExpression, TaggedTemplateExpression, LeftHandSideExpression, isImportDeclaration, ImportDeclaration, isArrowFunction, ArrowFunction } from "typescript";
import { resolveTemplateBindings, normalizeTemplate, normalizeStyle } from "./utils";

const moduleName = "vue-literal-compiler/tags";

const customTemplateTags = [
  "html",
  "pug",
  "handlebars"
];


export async function parseComponent(fileContent :string, options :Paddable = { pad: "line"}) :Promise<SFCDescriptor> {

  let styles :SFCBlock[] = []
  let template :SFCBlock | null = null;
  let customBlocks :SFCCustomBlock[] = [];
  let script :SFCBlock | null = null;


  const tokens = await tokenizeContent( fileContent );
  if( tokens === undefined ) return { template, script: normalizeScripts( fileContent ), styles, customBlocks };


  // Look for import definitions using this library.
  const importToken = tokens.find( token => token instanceof ImportDefinition && token.module === moduleName ) as ImportDefinition | undefined;
  if( importToken === undefined ) return { template, script: normalizeScripts( fileContent ), styles, customBlocks };
  // Extract literal and fatarrow tokens.
  const fatArrowTokens = tokens.filter( t => t instanceof FatArrowLiteral ) as FatArrowLiteral[];
  const literalTokens = tokens.filter( t => t instanceof TaggedLiteral ) as TaggedLiteral[];


  // Handle Style Tags.
  const resolvedStyle = resolveStyleLiteralTag({ importToken, literalTokens });
  const isScoped = resolvedStyle.isScoped;
  styles = resolvedStyle.styles;


  // Handle Template Tags.
  template = resolveTemplateLiteralTag({ importToken, fatArrowTokens, literalTokens, isScoped });

  

 

  return {
    template,
    script,
    styles,
    customBlocks
  };

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

function resolveCustomTemplateLiteralTags({ tagName, importToken, fatArrowTokens, literalTokens, isScoped } :CustomTemplateLiteralOptions ) {
  
  const contentFilter = ( content :string ) => {
    
    console.log( content );
    
    return content;
  }


  return templateLiteralTagResolver({
    tagName, 
    importToken, 
    fatArrowTokens, 
    literalTokens, 
    isScoped,
    contentFilter,
  });

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





async function tokenizeContent( fileContent :string ) {
  
  const source = createSourceFile( "vue.lit.ts", fileContent, ScriptTarget.Latest );

  const tokens = await find( source, node => {
    if( isImportDeclaration( node ) ) return new ImportDefinition( node )
    if( isTaggedTemplateExpression( node ) ) return new TaggedLiteral( node );
    //@ts-ignore
    if( isArrowFunction( node ) && node.body.tag ) return new FatArrowLiteral( node, fileContent );
  });

  return tokens;

}

export interface Paddable {
  pad: "line" | "space",
}


export function find<T>(source: SourceFile, condition: (node: Node) => (T | undefined), deepFind = true): Promise<T[] | undefined> {

  const allPromises: Promise<T>[] = [];

  find(t => {
    const promise = new Promise<T>((resolve, reject) => {
      if( t ) resolve(t)
      else reject("There was an issue. Sort it out.");
    });
    allPromises.push(promise);
  })

  return Promise.all(allPromises);

  //------------------------------------------------------------
  function find(onFound: (t: T) => void) {
    function iterator(sourceFile: SourceFile | Node) {
      sourceFile.forEachChild(childNode => {
        // Only a class can use a decorator. So we search for classes.
        const con = condition(childNode)
        if (con) onFound(con);
        if (deepFind) iterator(childNode);
      });
    }
    iterator(source);
  }

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

  constructor( node :HasTag & ArrowFunction, nextNode :Node,  fileContent :string ) {    
    
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

interface ReturnLiteralTag {
  name :string;
  parameters :string[];
  body :{
    text: string;
    start :number;
    end :number;
  }
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