import GL from '@luma.gl/constants';
import {Texture2D} from '@luma.gl/core';

const TEXTURE_WIDTH = 512;

const TEXTURE_FORMATS = {
  1: GL.R32F,
  2: GL.RG32F,
  3: GL.RGB32F,
  4: GL.RGBA32F
}
const DATA_FORMATS = {
  1: GL.RED,
  2: GL.RG,
  3: GL.RGB,
  4: GL.RGBA
}

function getNextPOT(x) {
  return Math.pow(2, Math.max(0, Math.ceil(Math.log2(x))));
}

export function getTexelCoord(index) {
  return {
    x: index % TEXTURE_WIDTH,
    y: Math.floor(index / TEXTURE_WIDTH)
  }
}

export function getTextureSize(nodeCount) {
  const width = TEXTURE_WIDTH;
  const height = getNextPOT(nodeCount / TEXTURE_WIDTH);
  return {width, height};
}

export function getFloatTexture(gl, size) {
  return new Texture2D(gl, {
    data: null,
    format: TEXTURE_FORMATS[size],
    type: GL.FLOAT,
    border: 0,
    mipmaps: false,
    parameters: {
      [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
      [GL.TEXTURE_MIN_FILTER]: GL.NEAREST
    },
    dataFormat: DATA_FORMATS[size],
    width: 1,
    height: 1
  });
}
