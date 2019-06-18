import {Buffer, Texture2D, Transform} from '@luma.gl/core';
import {getFloatTexture, getTextureSize, getTexelCoord} from './utils';

export default class EdgePositionTransform {
  constructor(gl) {
    this._sourcePositionsBuffer = [
      new Buffer(gl, {size: 3, byteLength: 12}),
      new Buffer(gl, {size: 3, byteLength: 12})
    ];
    this._targetPositionsBuffer = [
      new Buffer(gl, {size: 3, byteLength: 12}),
      new Buffer(gl, {size: 3, byteLength: 12})
    ];
    this._validityBuffer = [
      new Buffer(gl, {size: 1, byteLength: 4}),
      new Buffer(gl, {size: 1, byteLength: 4})
    ];

    this.nodePositionsTexture = getFloatTexture(gl, 4);

    this._swapBuffer = false;
    this._transform = this._getTransform(gl);
    this._bufferChanged = false;

    this.gl = gl;
  }

  get sourcePositionsBuffer() {
    return this._sourcePositionsBuffer[this._swapBuffer ? 1 : 0];
  }

  get targetPositionsBuffer() {
    return this._targetPositionsBuffer[this._swapBuffer ? 1 : 0];
  }

  get validityBuffer() {
    return this._validityBuffer[this._swapBuffer ? 1 : 0];
  }

  reset(sourceIndex) {
    if (this._bufferChanged) {
      this.update();
    }
  }

  update({nodeCount = this._nodeCount, edgeCount = this._edgeCount, attributes = this._attributes} = {}) {
    this._swapBuffer = !this._swapBuffer;
    this._nodeCount = nodeCount;
    this._edgeCount = edgeCount;
    this._attributes = attributes;

    const {nodePositionsTexture, sourcePositionsBuffer, targetPositionsBuffer, validityBuffer} = this;
    nodePositionsTexture.resize(getTextureSize(nodeCount));

    sourcePositionsBuffer.reallocate(edgeCount * 3 * 4);
    targetPositionsBuffer.reallocate(edgeCount * 3 * 4);
    validityBuffer.reallocate(edgeCount * 4);

    this._transform.update({
      sourceBuffers: {
        edgeSourceIndices: attributes.edgeSourceIndices,
        edgeTargetIndices: attributes.edgeTargetIndices,
      },
      feedbackBuffers: {
        sourcePositions: this.sourcePositionsBuffer,
        targetPositions: this.targetPositionsBuffer,
        isValid: this.validityBuffer
      },
      elementCount: edgeCount
    });

    this._bufferChanged = false;
  }

  run({nodePositionsBuffer}) {
    const {_transform, nodePositionsTexture} = this;
    nodePositionsTexture.setSubImageData({data: nodePositionsBuffer});

    _transform.run({
      uniforms: {
        nodePositions: nodePositionsTexture,
        textureDims: [nodePositionsTexture.width, nodePositionsTexture.height]
      }
    });

    this._bufferChanged = true;
    // console.log(this.validityBuffer.getData());
  }

  _getTransform(gl) {
    return new Transform(gl, {
      vs: `\
#version 300 es
in float edgeSourceIndices;
in float edgeTargetIndices;

uniform sampler2D nodePositions;
uniform vec2 textureDims;

out vec3 sourcePositions;
out vec3 targetPositions;
out float isValid;

ivec2 getVexelCoord(float index) {
  float y = floor(index / textureDims.x);
  float x = index - textureDims.x * y;
  return ivec2(x, y);
}

void main() {
  ivec2 sourceCoord = getVexelCoord(edgeSourceIndices);
  ivec2 targetoord = getVexelCoord(edgeTargetIndices);

  vec4 source = texelFetch(nodePositions, sourceCoord, 0);
  vec4 target = texelFetch(nodePositions, targetoord, 0);

  sourcePositions = source.rgb;
  targetPositions = target.rgb;

  isValid = source.a * target.a;
}
`,
      varyings: ['sourcePositions', 'targetPositions', 'isValid'],
      elementCount: 1,

      feedbackBuffers: {
        sourcePositions: this.sourcePositionsBuffer,
        targetPositions: this.targetPositionsBuffer,
        isValid: this.validityBuffer
      }
    });
  }
}
