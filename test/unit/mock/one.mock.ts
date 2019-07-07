//@ts-ignore
import { Component, Vue } from "vue-property-decorator";
//@ts-ignore
import { html } from "../utils";

/** 
 * @VueLiteralCompiler Template 
 * @param {any} c
 */ 
(c:App & ComponentAdons) => html`
  <div class="app-inner">
    <h1 @click="move()">Hello ${ 1 + 1 }</h1>
    <h3>I have a very special message to deliver.</h3>
    <button v-for="${ (c._item, c._index) in c.items }">I have a very special message to deliver.
      <p> Name: ${ c._item.name }</p>
      <p> Age: ${ c._item.age }</p>
    </button>
  </div>
`;

/** @VueLiteralCompiler Custom Block */
const myCustomOne =  html`  
  <my-custom-one lang="html">
    <h1>Hello This is a custom block</h1>
    <h1>Hi This is another custom block</h1>
  </my-custom-one>
`;

/** @VueLiteralCompiler Custom Block */
const myCustomTwo =  html`
  <yet-another-custom-block lang="pug">
    <h1>Hello This is a custom block</h1>
    <h1>Hi This is another custom block</h1>
  </yet-another-custom-block>
`;

@Component
//@ts-ignore
export default class App extends Vue {
  name = "John";
  number = 20;
  move = () => console.log("I am moving");
  render(createElement:any) {
    return createElement("div", "Hellow World" );
  }
  items = [
    { name: "Doe", age: 20 },
    { name: "Doe", age: 20 },
    { name: "Doe", age: 20 },
    { name: "Doe", age: 20 },
  ]
}

interface ComponentAdons {
  _item: typeof App.prototype.items[0]
  _index:number;
}

/** @VueLiteralCompiler Styles */
const styles = html`
  <style scoped>
    .app-inner {
      padding: 40px;
      background-color: yellow;
      color: black;
    }
  </style>

  <style lang="scss">
    .app-inner {
      padding: 40px;
      background-color: yellow;
      color: black;
    }
  </style>

  <style scoped lang="sass">
    .app-inner {
      padding: 40px;
      background-color: yellow;
      color: black;
    }
  </style>

    <style>
    .app-inner {
      padding: 40px;
      background-color: yellow;
      color: black;
    }
  </style>
`;