import {LineLayer} from '@deck.gl/layers';

export default class EdgeLayer extends LineLayer {
  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      'vs:#decl': `
attribute float instanceValid;
`,
      'vs:#main-end': `
vColor.a *= instanceValid + 0.1;
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
