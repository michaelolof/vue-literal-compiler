//@ts-ignore
const html = {} as any

/** @VueLiteralCompiler Template */
//@ts-ignore
const template = (h:MockVue) => html`
  <div>
    <h3 v-on:bind="${ h.namer + h.value }">Father Lord in heaven and help me please</h3>
  </div>
`;

//@ts-ignore
class MockVue {
  styles = { name:"michael", age: 20 };
  value = 20;
  namer = "John Doe";
  mover(param?:any) {
    console.log("logging", param)
  }
}