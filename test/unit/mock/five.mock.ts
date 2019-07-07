/** @VueLiteralCompiler Template */
const template = (c:MockFive) => `
  <template functional>
    <h1>Hello World!</h1>
  </template>
`;


/**      ------     SCRIPTS     ------      */
import { Component, Vue } from "../../e2e/node_modules/vue-property-decorator";

export default class MockFive extends Vue {
  
}


/** @VueLiteralCompiler Styles */
const styles = /* css */`
    .h1 {
      color: blue;
    }
`;