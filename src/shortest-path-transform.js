import {
  Buffer,
  Model,
  Framebuffer,
  clear,
  readPixelsToBuffer,
  // readPixelsToArray
} from '@luma.gl/core';
import GL from '@luma.gl/constants';

import {getFloatTexture, getTextureSize, getTexelCoord} from './utils';

export default class ShortestPathTransform {

  constructor(gl) {
    const nodeValueTextures = [
      getFloatTexture(gl, 4),
      getFloatTexture(gl, 4)
    ];
    // Mirrors nodeValueTexture
    const nodeValueBuffer = new Buffer(gl, {byteLength: 4, accessor: {size: 1, type: GL.FLOAT}});

    const nodeValueFramebuffer = new Framebuffer(gl, {
      id: `${this.id || 'transform'}-framebuffer-0`,
      width: 1,
      height: 1,
      attachments: {
        [GL.COLOR_ATTACHMENT0]: nodeValueTextures[0]
      }
    });

    this.gl = gl;
    this.nodeValueTexture = null;
    this.nodeValueTextures = nodeValueTextures;
    this.nodeValueFramebuffer = nodeValueFramebuffer;
    this.nodeValueBuffer = nodeValueBuffer;

    this._model = this._getModel(gl);
    this._swapTexture = false;
  }

  update({nodeCount, edgeCount, attributes}) {
    const textureSize = getTextureSize(nodeCount);
    this.nodeValueFramebuffer.resize(textureSize);
    // 1 float per channel, 4 changels per pixel
    this.nodeValueBuffer.reallocate(textureSize.width * textureSize.height * 4 * 4);

    this._model.setVertexCount(edgeCount);
   
    this._model.setAttributes({
      edgeSourceIndices: attributes.edgeSourceIndices,
      edgeTargetIndices: attributes.edgeTargetIndices,
      edgeValues: attributes.edgeValues
    });

    this._model.setUniforms({
      textureDims: [textureSize.width, textureSize.height]
    })
  }

  reset(sourceIndex) {
    const {gl, nodeValueFramebuffer, nodeValueTextures} = this;

    for (const texture of nodeValueTextures) {
      nodeValueFramebuffer.attach({
        [GL.COLOR_ATTACHMENT0]: texture
      });
      clear(gl, {framebuffer: nodeValueFramebuffer, color: [1e6, 1e6, 1e6, 0]});
      texture.setSubImageData({
        data: new Float32Array([0, 0, 0, 0]),
        ...getTexelCoord(sourceIndex),
        width: 1,
        height: 1
      });
    }
  }

  run() {
    const {_swapTexture, nodeValueFramebuffer, nodeValueTextures, nodeValueBuffer, _model} = this;

    const sourceTexture = nodeValueTextures[_swapTexture ? 0 : 1];
    const targetTexture = nodeValueTextures[_swapTexture ? 1 : 0];
    nodeValueFramebuffer.attach({
      [GL.COLOR_ATTACHMENT0]: targetTexture
    });

    _model.draw({
      framebuffer: nodeValueFramebuffer,
      parameters: {
        viewport: [0, 0, targetTexture.width, targetTexture.height],
        blend: true,
        blendFunc: [GL.ONE, GL.ONE, GL.ONE, GL.ONE],
        blendEquation: [GL.MIN, GL.MAX],
        depthMask: false,
        depthTest: false
      },
      uniforms: {
        nodeValueSampler: sourceTexture,
      }
    });

    // Copy texture to buffer
    // console.log(readPixelsToArray(nodeValueFramebuffer, {sourceFormat: GL.RGBA}));
    readPixelsToBuffer(nodeValueFramebuffer, {target: nodeValueBuffer, sourceFormat: GL.RGBA, sourceType: GL.FLOAT});

    this.nodeValueTexture = targetTexture;
    this._swapTexture = !this._swapTexture;
  }

  _getModel(gl) {
    return new Model(gl, {
      vs: `#version 300 es

uniform vec2 textureDims;
uniform sampler2D nodeValueSampler;

in float edgeSourceIndices;
in float edgeTargetIndices;
in vec3 edgeValues;

out vec3 value;

ivec2 getVexelCoord(float index) {
  float y = floor(index / textureDims.x);
  float x = index - textureDims.x * y;
  return ivec2(x, y);
}

vec2 getTexCoord(float index) {
  vec2 texCoord = vec2(getVexelCoord(index)) + 0.5;
  texCoord /= textureDims;

  return texCoord;
}

void main() {
  vec2 texCoord = getTexCoord(edgeTargetIndices);
  gl_Position = vec4(texCoord * 2.0 - 1.0, 0.0, 1.0);

  vec3 sourceValue = texelFetch(nodeValueSampler, getVexelCoord(edgeSourceIndices), 0).rgb;
  value = sourceValue + edgeValues;
}
      `,
      fs: `#version 300 es
precision highp float;
#define MAX_VALUE 100000.0

in vec3 value;
out vec4 color;

void main() {
  if (value.r >= MAX_VALUE) {
    discard;
  }
  color = vec4(value, 1.0);
}
      `,
      drawMode: GL.POINTS
    });
  }

}
