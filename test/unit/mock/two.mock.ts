//@ts-ignore
const html = {} as any

/** @VueLiteralCompiler Template */
//@ts-ignore
const template = (mock:MockVue) => html`
  <div class="ss">
    <h1>Hello World! Goodbye!</h1>
    <h3 v-on:bind="${ mock.mover() }">Father Lord in heaven and help me please</h3>
    <div @click="${ mock.styles }">
      <p><span>Name</span>: ${ mock.namer }</p>
      <p><span>Value</span>: ${ mock.value }</p>
    </div>
  </div>
`;


//@ts-ignore
class MockVue {
  styles = { name:"michael", age: 20 };
  value = 20;
  namer = "John Doe";
  mover() {
    console.log("I am moving")
  }
}