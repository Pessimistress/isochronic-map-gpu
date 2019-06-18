import {CompositeLayer} from '@deck.gl/core';
import Attribute from '@deck.gl/core/dist/esm/lib/attribute';
import {
  Buffer,
  Model,
  Framebuffer,
  clear,
  readPixelsToBuffer,
  readPixelsToArray,
  Texture2D
} from '@luma.gl/core';
import GL from '@luma.gl/constants';

import {ScatterplotLayer, LineLayer} from '@deck.gl/layers';

import {getFloatTexture, getTextureSize} from './utils';
import ShortestPathTransform from './shortest-path-transform';
import EdgeAttributesTransform from './edge-attributes-transform';
import NodeAttributesTransform from './node-attributes-transform';

import NodeLayer from './node-layer';
import EdgeLayer from './edge-layer';

const MAX_ITERATIONS = 500;

const MODE = {
  NONE: 0,
  NODE_DISTANCE: 1,
  TRAFFIC: 2,
  ISOCHRONIC: 3
};

export default class GraphLayer extends CompositeLayer {

  initializeState({gl}) {
    this.setState({
      attributes: this._getAttributes(gl),
      nodeAttributesTransform: new NodeAttributesTransform(gl),
      edgeAttributesTransform: new EdgeAttributesTransform(gl),
      shortestPathTransform: new ShortestPathTransform(gl),
      iteration: MAX_ITERATIONS,
      animation: requestAnimationFrame(this.animate.bind(this))
    });
  }

  updateState({props, oldProps, changeFlags}) {
    const dataChanged = changeFlags.dataChanged || changeFlags.updateTriggersChanged;
    const {attributes, shortestPathTransform, nodeAttributesTransform, edgeAttributesTransform} = this.state;

    if (props.data && dataChanged) {
      const nodeCount = props.data.nodes.length;
      const edgeCount = props.data.edges.length;

      for (const attributeName in attributes) {
        const attribute = attributes[attributeName];

        if (changeFlags.dataChanged ||
          (changeFlags.updateTriggersChanged && changeFlags.updateTriggersChanged[attribute.userData.accessor])) {
          attribute.setNeedsUpdate();
          const isNode = attributeName.startsWith('node');
          const numInstances = isNode ? nodeCount : edgeCount;
          attribute.allocate(numInstances);
          attribute.updateBuffer({
            numInstances,
            data: isNode ? props.data.nodes : props.data.edges,
            props,
            context: this
          })
        }
      }

      // Reset model
      shortestPathTransform.update({nodeCount, edgeCount, attributes});
      nodeAttributesTransform.update({nodeCount, edgeCount, attributes});
      edgeAttributesTransform.update({nodeCount, edgeCount, attributes});
    }

    if (dataChanged || props.sourceIndex !== oldProps.sourceIndex) {
      shortestPathTransform.reset(props.sourceIndex);
      nodeAttributesTransform.reset(props.sourceIndex);
      edgeAttributesTransform.reset(props.sourceIndex);
      this.setState({iteration: 0});
    }

    if (props.mode !== oldProps.mode && this.state.iteration === MAX_ITERATIONS) {
      nodeAttributesTransform.reset(props.sourceIndex);
      edgeAttributesTransform.reset(props.sourceIndex);
      this._updateAttributes();
    }
  }

  finalizeState() {
    super.finalizeState();

    cancelAnimationFrame(this.state.animation);
  }

  animate() {
    if (this.state.iteration < MAX_ITERATIONS) {
      const {shortestPathTransform} = this.state;
      let {iteration} = this.state;

      shortestPathTransform.run();

      this.setState({iteration: iteration + 1});
      this._updateAttributes();
    }

    // Try bind the callback to the latest version of the layer
    this.state.animation = requestAnimationFrame(this.animate.bind(this.state.layer || this));
  }

  _updateAttributes() {
    const {shortestPathTransform, nodeAttributesTransform, edgeAttributesTransform} = this.state;

    const moduleParameters = Object.assign(Object.create(this.props), {
      viewport: this.context.viewport
    });

    nodeAttributesTransform.run({
      moduleParameters,
      mode: this.props.mode,
      nodeValueTexture: shortestPathTransform.nodeValueTexture,
      distortion: this.state.iteration / MAX_ITERATIONS
    });
    edgeAttributesTransform.run({
      nodePositionsBuffer: nodeAttributesTransform.nodePositionsBuffer
    });
  }

  _getAttributes(gl) {
    return {
      nodePositions: new Attribute(gl, {
        size: 2,
        accessor: 'getNodePosition'
      }),
      nodeIndices: new Attribute(gl, {
        size: 1,
        accessor: 'getNodeIndex'
      }),
      edgeSourceIndices: new Attribute(gl, {
        size: 1,
        type: GL.INT,
        accessor: 'getEdgeSource'
      }),
      edgeTargetIndices: new Attribute(gl, {
        size: 1,
        type: GL.INT,
        accessor: 'getEdgeTarget'
      }),
      edgeValues: new Attribute(gl, {
        size: 3,
        accessor: 'getEdgeValue'
      })
    };
  }

  renderLayers() {
    const {data, getNodePosition, transition} = this.props;
    const {attributes, shortestPathTransform, nodeAttributesTransform, edgeAttributesTransform} = this.state;

    return [
      new EdgeLayer(this.getSubLayerProps({
        id: 'edges',
        data: data.edges,
        getSourcePosition: d => [0, 0],
        getTargetPosition: d => [0, 0],
        getColor: [200, 200, 200],
        widthScale: 3,

        instanceSourcePositions: edgeAttributesTransform.sourcePositionsBuffer,
        instanceTargetPositions: edgeAttributesTransform.targetPositionsBuffer,
        instanceValid: edgeAttributesTransform.validityBuffer,

        transitions: transition && {
          getSourcePosition: transition,
          getTargetPosition: transition,
          getIsValid: transition
        }
      })),

      new NodeLayer(this.getSubLayerProps({
        id: 'nodes',
        data: data.nodes,
        getPosition: getNodePosition,

        instancePositions: nodeAttributesTransform.nodePositionsBuffer,
        instanceFillColors: nodeAttributesTransform.nodeColorsBuffer,
        instanceRadius: nodeAttributesTransform.nodeRadiusBuffer,

        transitions: transition && {
          getPosition: transition,
          getFillColor: transition,
          getRadius: transition
        },

        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 200, 255, 200]
      }))
    ]
  }
}

GraphLayer.defaultProps = {
  mode: MODE.NODE_DISTANCE
};
