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
- ### [Type Safe Bindings vs Type Safe Templates.](#type-bindings-vs-type-templates)


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
The opening and closing style tags can also be optional
```ts
/** @VueLiteralCompiler Styles */
const styles = `
  .p {
    font-size: 2em;
    text-align: center;
  }
`;
```
Optional Style Tags are global by default.

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
### 2. Interoperability with exisiting `.vue` files
Using  `.vue.ts` or `.vue.js` with an existing code base of `.vue` files can cause unexpected errors due to name clashes. This is due to the way `vue-loader` and `ts-loader` work internally. To avoid this when working with an existing codebase of `.vue` files, just use a different file type aside from `.vue.ts` or `.vue.js`. 

## <a name="type-bindings-vs-type-templates">Type Safe Bindings vs Type Safe Templates</a>
With Fat Arrow Templates and Variable Encapsulations **your bindings are type safe**. This is a different approach from DSLs like JSX/TSX which promises typesafe templates. 


With type safe bindings we can maintain the regular vue syntax we are used to (i.e `v-show` or `v-if` instead of `teniary`, `v-for` instead of `map(...)`, `@click` etc.) and still get complete type safety.

**Basic Data Binding:**

Normal Vue syntax:
```
<span>Message: {{ msg }}</span>
```
Type Safe Alternative:
```
<span>Message: ${ app.msg }</span>
```
\
**Attribute Data Bindings**

Normal Vue Syntax:
```
<div v-bind:id="dynamicId"></div>

<button v-bind:disabled="isButtonDisabled">Button</button>
```
Type Safe Alternative:
```
<div v-bind:id="${ app.dynamicId }"></div>

<button v-bind:disabled="${ app.isButtonDisabled }">Button</button>
```
\
**Using JavaScript Expressions**

Normal Vue Syntax:
```html
{{ number + 1 }}

{{ ok ? 'YES' : 'NO' }}

{{ message.split('').reverse().join('') }}

<div v-bind:id="'list-' + id"></div>

<form v-on:submit.prevent="onSubmit"> ... </form>

<a @click="doSomething"> ... </a>
```

Type Safe Alternative:
```ts
${ app.number + 1 }

${ app.ok ? 'YES' : 'NO' }

${ app.message.split('').reverse().join('') }

<div v-bind:id="${ 'list-' + app.id }"></div>

<form v-on:submit.prevent="${ app.onSubmit }"> ... </form>

<a @click="${ app.doSomething() }"> ... </a>
```
\
**Class And Style Bindings**

Normal Vue Syntax:
```html
<div v-bind:class="{ active: isActive, 'text-danger': hasError }"></div>

<div v-bind:class="[ activeClass, errorClass ]"></div>

<div v-bind:class="[ isActive ? activeClass : '', errorClass ]"></div>

<div v-bind:class="[ { active: isActive }, errorClass ]"></div>

<div v-bind:style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
```
Type Safe Alternative:
```ts
<div v-bind:class="${{ active: app.isActive, 'text-danger': app.hasError }}"></div>

<div v-bind:class="${[ app.activeClass, app.errorClass ]}"></div>

<div v-bind:class="${[ app.isActive ? app.activeClass : '', app.errorClass ]}"></div>

<div v-bind:class="${[ { active: app.isActive }, app.errorClass ]}"></div>

<div v-bind:style="${{ color: app.activeColor, fontSize: app.fontSize + 'px' }}"></div>
```
\
**List Rendering**

List Rendering are sort of an edge case when it comes to type safety due to the way they are declared. (`v-for`s in Vue are not exactly JavaScript compliant.)

A typical Vue List would look like this:
```html
<ul id="example-1">
  <li v-for="item in items">
    {{ item.message }}
  </li>
</ul>
```
Following our normal convention, the Fat Arrow alternative should typically look like this:
```ts
<ul id="example-1">
  <li v-for="${ app.item in app.items }">
    ${ app.item.message }
  </li>
</ul>
```
Unfortunately this would throw a compile time error in TypeScript saying `app.item` is not found.

To get around this error we need to do two things.

First Create a Template Addon Interface
```ts
interface TemplateAddOn {
  _item: typeof App.prototype.items[0]
}
``` 
Then in the Fat Arrow Template:
```ts
const template = (app:App & TemplateAddOn) => `
  <ul id="example-1">
    <li v-for="${ <any> app._item in app.items }">
      ${ app._item.message }
    </li>
  </ul>`
```
Now `app._item` is now recognized.\
The underscore in `app._item` is just there to indicate to you that it is an addon and not part of your original component. (Feel free to use whatever you want.)\
The cast to any however is necessary if `app._item` is not of type `number`, `string` or `symbol`.\

**Only `<any>` casts are supported by the compiler.**

Other examples of type safe lists:
```ts
<ul id="example-2">
  <li v-for="${ <any> (app._item, app._index) in app._items }">
    ${ app.parentMessage } - ${ app._index } - ${ app._item.message }
  </li>
</ul>

<div v-for="${ <any> (app._value, app._key, app._index) in app.object }">
  ${ app._index }. ${ app._key }: ${ app._value }
</div>
```
 