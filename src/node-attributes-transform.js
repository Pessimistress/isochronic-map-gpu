import {Buffer, Texture2D, Transform} from '@luma.gl/core';
import {getFloatTexture, getTextureSize, getTexelCoord} from './utils';

export default class NodePositionTransform {
  constructor(gl) {
    this._nodePositionsBuffer = [
      new Buffer(gl, {size: 4, byteLength: 12}),
      new Buffer(gl, {size: 4, byteLength: 12})
    ];
    this._nodeColorsBuffer = [
      new Buffer(gl, {size: 4, byteLength: 16}),
      new Buffer(gl, {size: 4, byteLength: 16})
    ];
    this._nodeRadiusBuffer = [
      new Buffer(gl, {size: 1, byteLength: 4}),
      new Buffer(gl, {size: 1, byteLength: 4})
    ];

    this._swapBuffer = false;
    this._bufferChanged = false;

    this._transform = this._getTransform(gl);

    this.gl = gl;
  }

  get nodePositionsBuffer() {
    return this._nodePositionsBuffer[this._swapBuffer ? 1 : 0];
  }

  get nodeColorsBuffer() {
    return this._nodeColorsBuffer[this._swapBuffer ? 1 : 0];
  }

  get nodeRadiusBuffer() {
    return this._nodeRadiusBuffer[this._swapBuffer ? 1 : 0];
  }

  reset(sourceIndex) {
    this._sourcePosition = this._transform.sourceBuffers[0].nodePositions.value.slice(sourceIndex * 2, sourceIndex * 2 + 2);
    
    if (this._bufferChanged) {
      this.update();
    }
  }

  update({nodeCount = this._nodeCount, attributes = this._attributes} = {}) {
    this._swapBuffer = !this._swapBuffer;
    this._nodeCount = nodeCount;
    this._attributes = attributes;

    const textureSize = getTextureSize(nodeCount);
    this.nodePositionsBuffer.reallocate(textureSize.width * textureSize.height * 4 * 4);
    this.nodeColorsBuffer.reallocate(textureSize.width * textureSize.height * 4 * 4);
    this.nodeRadiusBuffer.reallocate(textureSize.width * textureSize.height * 4);

    this._transform.update({
      sourceBuffers: {
        nodePositions: attributes.nodePositions,
        nodeIndices: attributes.nodeIndices
      },
      feedbackBuffers: {
        position: this.nodePositionsBuffer,
        color: this.nodeColorsBuffer,
        radius: this.nodeRadiusBuffer
      },
      elementCount: nodeCount
    });
    this._bufferChanged = false;
  }

  run({moduleParameters, nodeValueTexture, distortion}) {
    this._transform.model.updateModuleSettings(moduleParameters);

    this._transform.run({
      uniforms: {
        sourcePosition: this._sourcePosition,
        nodeValues: nodeValueTexture,
        distortion,
        textureDims: [nodeValueTexture.width, nodeValueTexture.height]
      }
    });
    this._bufferChanged = true;

    // console.log(this.nodeColorsBuffer.getData());
  }

  _getTransform(gl) {
    return new Transform(gl, {
      vs: `\
#version 300 es
in vec2 nodePositions;
in float nodeIndices;

uniform sampler2D nodeValues;
uniform vec2 textureDims;
uniform vec2 sourcePosition;
uniform float distortion;

out vec4 position;
out vec4 color;
out float radius;

const vec4 GREEN = vec4(0., 255., 0., 255.);
const vec4 YELLOW = vec4(255., 255., 0., 255.);
const vec4 RED = vec4(255., 0., 0., 255.);
const vec4 BLACK = vec4(0., 0., 0., 255.);

ivec2 getVexelCoord(float index) {
  float y = floor(index / textureDims.x);
  float x = index - textureDims.x * y;
  return ivec2(x, y);
}

void main() {
  vec4 valuePixel = texelFetch(nodeValues, getVexelCoord(nodeIndices), 0);
  float value = valuePixel.r;
  float isValid = valuePixel.a;

  // distance in meters
  float distance = length((nodePositions - sourcePosition)
   * project_uCommonUnitsPerWorldUnit.xy / project_uCommonUnitsPerMeter.xy);
  float r = sqrt(value / distance * 20.);
  r = mix(1.0, r, distortion);

  // vec3 pos = vec3(nodePositions, r * 200.);
  vec3 pos = vec3(mix(sourcePosition, nodePositions, r), 0.0);

  position = vec4(pos, isValid);

  color = mix(GREEN, YELLOW, r);
  color = mix(color, RED, max(r - 1.0, 0.0));
  color = mix(color, BLACK, min(1.0, max(r - 2.0, 0.0)));

  radius = pow(value, 0.75) * isValid;
}
`,
      varyings: ['position', 'color', 'radius'],
      elementCount: 1,

      feedbackBuffers: {
        position: this.nodePositionsBuffer,
        color: this.nodeColorsBuffer,
        radius: this.nodeRadiusBuffer
      }
    });
  }
}
