import fs from "fs";

export const mock = {
  one: {
    sfc: fs.readFileSync("./test/unit/mock/one.mock.ts").toString(),
    template: {
      content: getMockOneTemplateContent(),
    }
  },
  two: { sfc: fs.readFileSync("./test/unit/mock/two.mock.ts").toString() },
  three: { sfc: fs.readFileSync("./test/unit/mock/three.mock.ts").toString(), },
  four: { sfc: fs.readFileSync("./test/unit/mock/four.mock.ts").toString(), },
  five: { sfc: fs.readFileSync("./test/unit/mock/five.mock.ts").toString(), },
  six: { sfc: fs.readFileSync("./test/unit/mock/six.mock.ts").toString(), },
}


function getMockOneTemplateContent() {
  return `
  <div class="app-inner">
    <h1 @click="move()">Hello {{ name }}</h1>
    <h3>I have a very special message to deliver.</h3>
  </div>`;
}