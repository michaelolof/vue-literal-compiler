# Vue Literal Compiler
A simple stand in replacement for the default vue-template-compiler that allows you write Vue Templates, Scoped CSS, Custom Blocks and Scripts in SFC format all in your JavaScript/TypeScript files.

## Preview 
![alt-text](https://github.com/michaelolof/vue-literal-compiler/blob/master/images/vue-vs-lit-preview.png?raw=true)

## Motivation
* Maintain the SFC paradigm. Write all your Templates, Styles and Scripts in one file (JavaScript/TypeScript)
* Compiles your literal templates into render functions at compile time rather than at runtime.
* Provide Support for CSS in JavaScript/TypeScript.
* Provide Support for Scoped CSS
* Provide support for SASS, SCSS, LESS etc. using the lang attribute.
* Provide Support for Custom Blocks in JavaScript/TypeScript.
* Provide Support for lintable typesafe templates using Functional Templates

## Change Log
  - ### v 1.2.6
    - Added Support for Type Safe `v-for` bindings.
  - ### v 1.2.5
    - Opening and Closing Style Tags `<style></style>` are now optional. (They will be global by default)
    - Added Support for Functional Templates.

## See Working Examples
* [Vue Literal Compiler Sample](https://github.com/michaelolof/vue-literal-compiler-sample)

## Get Started
- ### [Installation](#installation)
- ### [API](#api)
- ### [Painless Migration / Testing](#painless-migration-testing)
- ### [Why `.lit.*` files?](#why-lit-files)


## <a name="installation">Installation</a>

1.  Install Vue Literal Compiler
```
  npm install --save-dev vue-literal-compiler
```

2.  Include it in your webpack.config.js vue-loader options.
```js
{
  test: /\.lit\.ts$/,
  loader: 'vue-loader',
  options: {
    compiler: require("vue-literal-compiler"),
  }
},
```
3.  Add an additional Vue Loader Configuration. This is to appease VueLoaderPlugin and prevent it from squawking. See issue https://github.com/vuejs/vue-loader/issues/1238
```js
{
  test: /\.vue$/,
  loader: "vue-loader"
},
  
{
  test: /\.lit\.ts$/,
  loader: 'vue-loader',
  options: {
    compiler: require("vue-literal-compiler"),
    loaders: {
      'scss': 'vue-style-loader!css-loader!sass-loader',
      'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
    }
  }
},
```

4.  Finally since we're using plain TypeScript / JavaScript files rather than .vue files, ts-loader or babel will attempt to parse our files. We have to stop this.\
So in ts-loader's config we do this.

```js
{
  test: /\.tsx?/,
  loader: 'ts-loader',
  exclude: [ /node_modules/, /\.lit.ts$/ ],
  options: {
    appendTsSuffixTo: [/\.vue$/],
  }
},
```

## <a name="api">API</a>
WIth `.vue` files we're used to putting our html, css (sass, less etc) and scripts (javascript or typescript) all in one file. It gave us the ability to reason about our components as a single unit in a single location.\
This is also very possible with Vue Literal Compiler.

### Templates
So with a `.vue` file we can define our templates like this:
```html
<template>
  <div class="app">
    <h1> {{ greeting }} </h1>
    <button @click="sayHi()"></button>
  </div>
</template>
```
The same template in a plain javascript/typescript file will look like this.
```ts
/** @VueLiteralCompiler Template */
const template = `
  <div class="app">
    <h1> {{ greeting }} </h1>
    <button @click="sayHi()"></button>
  </div>
`;
```
Notice you don't need the template tag to define a template.\
If we wanted to support multiple languages just like in `.vue` files, we simply add the template tag back with a lang atrribute.
```ts
/** @VueLiteralCompiler Template */
const template = `
  <template lang="jade">
    div
      p {{ greeting }} World!
      other-component
    </div>
  </template>  
`;
```
### Fat Arrow Templates
A Fat arrow template is one which accepts one parameter (the instance of your vue component) and returns a string (the template literal)\
To use a fat arrow template simply change the template variable from a string to a function that takes one parameter and returns a string.\
**NOTE - You must use a fat arrow. Regular functions will not work**
```ts
/** @VueLiteralCompiler Template */
const template = app => `
  <div class="app">
    <h1> ${ app.greeting } </h1>
    <button @click="sayHi()"></button>
  </div>
`;
```
Notice you can easily switch between using string literals variable encapsulation `<h1> app.greeting </h1>` and your regular vue template style `<button @click="sayHi()"></button>`\
It just works.\
To support intellisense and code refractoring support in TypeScript, just type hint app
```ts
const template = (app:App) => `
  <div class="app">
    <h1> ${ app.greeting } </h1>
    <button @click="${ app.sayHi() }"></button>
  </div>
`;
```
At this point `app.greeting` and `app.sayHi()` is now type safe.\
\
To support syntax highlighting for VSCode simply install an extension like vscode-lit-html and tag your string literals as defined by the installed extension.

### Styles
Styles are defined in `.vue` files using a style tag
```html
<style>
  .p {
    font-size: 2em;
    text-align: center;
  }
</style>
```
To do the same using a Vue Literal Compiler:
```ts
/** @VueLiteralCompiler Styles */
const styles = `
  <style>
    .p {
      font-size: 2em;
      text-align: center;
    }
  </style>
`;
```
To Support scoped styles, preprocessor support or multiple styles.
```ts
/** @VueLiteralCompiler Styles */
const styles = `
  <style scoped lang="scss">
    .p {
      font-size: 2em;
      text-align: center;
      
      & span {
        font-weight: bold;
      }
    }
  </styles>

  <style>
    body {
      background-color: gray;
    }
  </style>
`;
```
### Custom Blocks
A custom block in a `.vue` file would look this:
```html
<custom-block>
  <h1>Hello World</h1>
  <p>Just make sure things work.</p>
</custom-block>

<another-custom-block>
  <p>This is how we rock</p>
</another-custom-block>
```
The same with Vue Literal Compiler will look like this.
```ts
/** @VueLiteralCompiler Custom Block */
const customBlock = `
  <custom-block>
    <h1>Hello World</h1>
    <p>Just make sure things work.</p>
  </custom-block>
`;

/** @VueLiteralCompiler Custom Block */
const anotherCustomBlock = `
  <another-custom-block>
    <p>This is how we rock</p>
  </another-custom-block>
`;
```

## <a name="painless-migration-testing">Painless Migration / Testing</a>
One of the immediate advantages of Vue Literal Compiler is the painless interoperability with existing `.vue` code base. You can use Vue Literal Compiler (`.lit.*`) side by side with your existing `.vue` **today**. To do that simply modify your webpack.config.js
```js
{
  test: /\.tsx?/,
  loader: 'ts-loader',
  exclude: [ /node_modules/, /\.lit.ts$/ ],
  options: {
    appendTsSuffixTo: [/\.vue$/],
  }
},
{ 
  test: /\.vue$/, 
  loader: 'vue-loader' 
  options: {
    loaders: {
      // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
      // the "scss" and "sass" values for the lang attribute to the right configs here.
      // other preprocessors should work out of the box, no loader config like this necessary.
      'scss': 'vue-style-loader!css-loader!sass-loader',
      'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
    }
  }
},
{
  test: /\.lit\.ts$/,
  loader: 'vue-loader',
  options: {
    compiler: require("vue-literal-compiler"),
    loaders: {
      // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
      // the "scss" and "sass" values for the lang attribute to the right configs here.
      // other preprocessors should work out of the box, no loader config like this necessary.
      'scss': 'vue-style-loader!css-loader!sass-loader',
      'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
    }
  }
},
```
At this point migrating your code base from `.vue` to `.lit.ts` or `.lit.js` is just a matter of copying and pasting your templates, styles and scripts respectively.

## <a name="why-lit-files">Why `.lit.*` files?</a>
While Vue Literal Compiler doesn't discriminate against file extension types (Whatever test case you put in your webpack config is what the compiler will use.) There are some reasons you might want to use .lit.* files over .vue.* files though.
### 1. Standards
First Vue Literal Compiler doesn't care what file type you use. But standards are important.
### 2. Interoperability with `.vue` files
Using  `.vue.ts` or `.vue.js` with an existing code base of `.vue` files can cause unexpected errors due to name clashes. This is due to the way `vue-loader` and `ts-loader` work internally. To avoid this when working with an existing codebase of `.vue` files, just use a different file type aside from `.vue.ts` or `.vue.js`. 