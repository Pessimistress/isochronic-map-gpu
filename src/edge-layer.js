import {LineLayer} from '@deck.gl/layers';

export default class EdgeLayer extends LineLayer {
  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      'vs:#decl': `
attribute float instanceValid;
varying float isValid;
`,
      'vs:#main-start': `
isValid = instanceValid;
`,
      'fs:#decl': `
varying float isValid;
`,
      'fs:#main-start': `
if (isValid < 1.0) discard;
`
    };
    return shaders;
  }

  initializeState(context) {
    super.initializeState(context);

    // TODO: deck.gl's Attribute's update does not respect external buffer's offset or stride
    this.getAttributeManager().addInstanced({
      instanceValid: {size: 1, accessor: 'getIsValid', transition: true}
    });
  }
}
