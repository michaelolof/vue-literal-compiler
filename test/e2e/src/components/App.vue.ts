import { Component, Vue } from "vue-property-decorator";
import { template, style } from "../utils"

(app:App & TemplateAddOns) => template`
  <template>
    <div class="app-inner">
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


@Component export default class App extends Vue {
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


style`
  body {
    background-color: blue;
  }
  .app-inner {
    padding: 40px;
    background-color: gold;
    color: white;
  }
`;
