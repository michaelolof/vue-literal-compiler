( app :string ) => template`
<div>
  
</div>
`;



//@ts-ignore
import { style, template, customBlock } from "vue-literal-compiler/tags";


customBlock`
  <dom>
    Walk with me and let me see.
  </dom>
`

style`<style>
  .p {
    font-weight: 20px;
    background-color: transparent;
  }
</style>`
