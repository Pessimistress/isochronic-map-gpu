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

const MAX_ITERATIONS = 100;

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

    if (props.data && dataChanged) {
      const {attributes, shortestPathTransform, nodeAttributesTransform, edgeAttributesTransform} = this.state;
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
      this.setSourceIndex(props.sourceIndex);
    }
  }

  finalizeState() {
    super.finalizeState();

    cancelAnimationFrame(this.state.animation);
  }

  animate() {
    if (this.state.iteration < MAX_ITERATIONS) {
      const {transition} = this.props;
      const {shortestPathTransform, nodeAttributesTransform, edgeAttributesTransform} = this.state;
      let {iteration} = this.state;

      let targetIteration = transition ? MAX_ITERATIONS : iteration + 1;

      while (iteration < targetIteration) {
        shortestPathTransform.run();
        iteration++;
      }

      const moduleParameters = Object.assign(Object.create(this.props), {
        viewport: this.context.viewport
      });
      nodeAttributesTransform.run({
        moduleParameters,
        nodeValueTexture: shortestPathTransform.nodeValueTexture,
        distortion: iteration / MAX_ITERATIONS
      });
      edgeAttributesTransform.run({
        nodePositionsBuffer: nodeAttributesTransform.nodePositionsBuffer
      });

      this.setState({iteration});
      this.setNeedsRedraw();
    }
    this.state.animation = requestAnimationFrame(this.animate.bind(this));
  }

  setSourceIndex(sourceIndex) {
    this.state.shortestPathTransform.reset(sourceIndex);
    this.state.nodeAttributesTransform.reset(sourceIndex);
    this.state.edgeAttributesTransform.reset(sourceIndex);
    this.setState({iteration: 0});
  }

  _getAttributes(gl) {
    return {
      nodePositions: new Attribute(gl, {
        size: 2,
        accessor: 'getNodePosition'
      }),
      nodeIndices: new Attribute(gl, {
        size: 1,
        accessor: (_, {index}) => index
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
        size: 1,
        accessor: 'getEdgeValue'
      })
    };
  }

  renderLayers() {
    const {data, getNodePosition, transition} = this.props;
    const {attributes, shortestPathTransform, nodeAttributesTransform, edgeAttributesTransform} = this.state;

    return [
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
      })),

      new EdgeLayer(this.getSubLayerProps({
        id: 'edges',
        data: data.edges,
        getSourcePosition: d => [0, 0],
        getTargetPosition: d => [0, 0],

        instanceSourcePositions: edgeAttributesTransform.sourcePositionsBuffer,
        instanceTargetPositions: edgeAttributesTransform.targetPositionsBuffer,
        instanceValid: edgeAttributesTransform.validityBuffer,

        transitions: transition && {
          getSourcePosition: transition,
          getTargetPosition: transition,
          getIsValid: transition
        }
      }))
    ]
  }
}
