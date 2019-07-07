import { Component, Vue } from "vue-property-decorator";
import { html } from "../utils";

/** @VueLiteralCompiler Template */ 
const template = (app:App & TemplateAddOns) => html`
  <template>
    <div class="app-inner">
      <h1 @click="${ app.move() }">Hello ${ app.name }</h1>
      <h3>I have a very special message to deliver. {{ name }}</h3>
      <div :style="${ app.styles }"> Name</div>
      <div v-bind:style="${[ { active: app._item }, app.name ]}"></div>
      <ul v-for="${ <any> app._item in app.items }" :key="${ app._item.id }">
        <li>
          No: ${ app._index + 1 }
          Name: <span><b> ${ app._item.name }</b></span>
          Age: <span><b>${ app._item.age }</b></span>
        </li>
      </ul>
    </div>
  </template>
`;


@Component
export default class App extends Vue {
  styles = {
    color: "blue",
    backgroundColor: "green",
  }

  items = [
    { name: "John Doe", age: 21 },
    { name: "Justice Ojediran", age: 26 },
    { name: "Pious Imue", age: 19 },
    { name: "Adetola Olarenwaju", age: 12 },
    { name: "Matthew Bamijoko", age: 41 },
  ];
  
  name = "John";
  move() {
    console.log("I am moving");
  }
}

interface TemplateAddOns {
  _index:number;
  _item: typeof App.prototype.items[0] & { id: number };
}


/** @VueLiteralCompiler Styles */
const styles =  html`
  .app-inner {
    padding: 40px;
    background-color: gold;
    color: white;
  }
`;
