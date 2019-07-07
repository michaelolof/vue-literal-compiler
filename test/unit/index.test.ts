import { expect } from "chai";
import { parseComponent, compile } from "../../src/";
import { mock } from "./mock/index.mock";
import { SFCDescriptor, SFCBlock } from "@vue/component-compiler-utils/dist/parse";

describe("function parseComponent(options:ParseOptions):SFCDescriptor", () => {
  let descriptor!:SFCDescriptor;

  before(() => {
    descriptor = parseComponent( mock.one.sfc );
  })
  
  it("should contain the 1 template, 4 styles, 1 script and 2 custom block fields", () => {
    expect( descriptor.template ).to.not.deep.equals( undefined );
    expect( descriptor.styles.length ).to.deep.equals( 4 );
    expect( descriptor.script ).to.not.deep.equals( undefined );
    expect( descriptor.customBlocks.length ).to.deep.equals( 2 );
  });

  describe("For the template descriptor", () => {
    let template!:SFCBlock;
    before(() => template = descriptor.template! );
    it("should have lang as undefined or html", () => {
      expect( template.lang ).to.deep.equal( undefined )
      // expect( template.content.trim() ).to.deep.equal( mock.one.template.content.trim() )
    })
  })
});

describe.only("function parseComponent(options:ParseOptions):SFCDescriptor", () => {
  it("should work sha", () => {
    const dd = parseComponent( mock.six.sfc );
  });
});