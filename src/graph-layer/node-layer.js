import {ScatterplotLayer} from '@deck.gl/layers';

export default class NodeLayer extends ScatterplotLayer {
  initializeState(context) {
    super.initializeState(context);

    // TODO: deck.gl's Attribute's update does not respect external buffer's stride
    this.getAttributeManager().getAttributes().instancePositions.size = 4;
  }
}
