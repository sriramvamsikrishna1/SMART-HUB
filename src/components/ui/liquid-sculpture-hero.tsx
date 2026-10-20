import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'

// --- Utility Helpers ---
function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

function hexToRgb(str: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof str !== 'string') return fallback
  const s = str.trim()
  let m = s.match(/^#?([0-9a-f]{3})$/i)
  if (m) {
    const [r, g, b] = m[1].split('').map(c => parseInt(c + c, 16) / 255)
    return [r, g, b]
  }
  m = s.match(/^#?([0-9a-f]{6})([0-9a-f]{2})?$/i)
  if (m) {
    const num = parseInt(m[1], 16)
    return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255]
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
  if (m) {
    return [+m[1] / 255, +m[2] / 255, +m[3] / 255]
  }
  return fallback
}

// --- Shader Snippets ---
const noiseGLSL = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }
vec2 ambientField(vec2 uv, float t){
  vec2 q = uv*vec2(3.2,1.7);
  vec2 a = vec2(vnoise(q+vec2(t*0.11,0.0))-0.5, vnoise(q+vec2(5.2,t*0.08)+3.1)-0.5);
  vec2 q2 = uv*vec2(7.5,4.0) + vec2(-t*0.19, t*0.13);
  vec2 b = vec2(vnoise(q2+1.7)-0.5, vnoise(q2+9.3)-0.5);
  return a + b*0.45;
}
`

const energyGLSL = `
float energyAt(vec2 rectPx, vec2 mouse, float radius, float presence, float wakeEnergy){
  vec2 d = rectPx - mouse;
  float f = exp(-dot(d,d)/(radius*radius))*presence;
  return smoothstep(0.06, 0.5, f*1.15 + wakeEnergy*1.7);
}
`

const quadVS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }
`

const flowFS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform vec2 uSize;
uniform float uRadius;
uniform float uPresence;
uniform float uDecay;
vec2 decV(vec4 c){ return (c.rg*255.0-128.0)/127.0; }
void main(){
  vec2 v0 = decV(texture(uPrev, vUv));
  vec2 uv = vUv - v0*uTexel*2.5;
  vec4 c = texture(uPrev, uv)*0.52
    + 0.12*(texture(uPrev, uv+vec2(uTexel.x,0.0)) + texture(uPrev, uv-vec2(uTexel.x,0.0))
          + texture(uPrev, uv+vec2(0.0,uTexel.y)) + texture(uPrev, uv-vec2(0.0,uTexel.y)));
  vec2 v = decV(c);
  float p = c.b;
  vec2 d = (vUv-uMouse)*uSize;
  float f = exp(-dot(d,d)/(uRadius*uRadius))*uPresence;
  float sp = clamp(length(uVel)*2.5, 0.0, 1.0);
  v += uVel*f*0.22;
  p = max(p, f*sp);
  v *= uDecay;
  p *= uDecay;
  v = sign(v)*max(abs(v)-1.2/127.0, 0.0);
  p = max(p-1.2/255.0, 0.0);
  v = clamp(v, -1.0, 1.0);
  o = vec4((v*127.0+128.0)/255.0, p, 1.0);
}
`

const simFS = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uFlow;
uniform vec2 uSize;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uStrength;
uniform float uSpread;
uniform float uTurb;
uniform float uReturn;
uniform float uTime;
uniform float uDt;
uniform float uIntro;
${noiseGLSL}
vec2 curl(vec2 p){
  const float e = 0.35;
  float a = vnoise(p+vec2(0.0,e)) - vnoise(p-vec2(0.0,e));
  float b = vnoise(p+vec2(e,0.0)) - vnoise(p-vec2(e,0.0));
  return vec2(a, -b)/(2.0*e);
}
void main(){
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 hm = texelFetch(uHome, ij, 0);
  if(hm.w <= 0.0){ o = vec4(0.0); return; }
  vec4 st = texelFetch(uState, ij, 0);
  vec2 off = st.xy;
  vec2 vel = st.zw;
  float sd = hm.z;
  float light = 0.45 + sd*1.1;

  vec2 p = hm.xy*uSize + off;
  vec4 fl = texture(uFlow, clamp(p/uSize, 0.0, 1.0));
  vec2 wake = (fl.rg*255.0-128.0)/127.0;
  float pr = fl.b;

  vec2 toM = p - uMouse;
  float r2 = dot(toM,toM);
  float f = exp(-r2/(uRadius*uRadius))*uPresence;
  vec2 n = toM*inversesqrt(r2+1.0);
  float e = clamp(pr*2.0 + f, 0.0, 1.0);

  vec2 acc = vec2(0.0);
  acc += n*f*1.25*uStrength*uSpread*light;
  acc += vec2(-n.y, n.x)*f*1.45*uStrength*uSpread*(0.4+sd);
  acc += (wake*42.0*uSpread*light - vel)*e*0.08;
  vec2 q = p*0.0095 + vec2(uTime*0.35, -uTime*0.2);
  vec2 c = curl(q) + 0.5*curl(q*2.3 + 7.1);
  acc += c*(e*1.2*uSpread + uIntro*1.5)*uTurb*light;
  float k = (0.006 + 0.02*uReturn)*(0.65+sd*0.7)*(1.0 - uIntro*0.75);
  acc -= off*k;

  vel += acc*uDt;
  vel *= pow(mix(0.93, 0.955, e), uDt);
  off += vel*uDt;
  if(dot(off,off) < 0.0004 && dot(vel,vel) < 0.0004){ off = vec2(0.0); vel = vec2(0.0); }
  o = vec4(off, vel);
}
`

const partVS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uCol;
uniform sampler2D uFlow;
uniform int uTexW;
uniform vec4 uRect;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uDot;
uniform float uTime;
uniform float uAmbient;
uniform float uStreak;
uniform float uIntroVis;
uniform float uRest;
uniform vec3 uTint;
out vec2 vLocal;
out float vHalfLen;
out float vR;
out vec3 vCol;
out float vA;
${noiseGLSL}
${energyGLSL}
void main(){
  int id = gl_InstanceID;
  ivec2 ij = ivec2(id % uTexW, id / uTexW);
  vec4 hm = texelFetch(uHome, ij, 0);
  vec4 st = texelFetch(uState, ij, 0);
  vec4 cl = texelFetch(uCol, ij, 0);

  float wakeE = texture(uFlow, hm.xy).b;
  float E = energyAt(hm.xy*uRect.zw, uMouse, uRadius, uPresence, wakeE);
  float lift = smoothstep(0.35, 2.5, length(st.xy));
  float a = max(max(E, lift), max(uRest, 1.0-uIntroVis));
  if(a < 0.01 || hm.w <= 0.0){ gl_Position = vec4(2.0,2.0,2.0,1.0); return; }

  vec2 base = uRect.xy + hm.xy*uRect.zw + st.xy;
  base -= ambientField(hm.xy, uTime)*10.0*uAmbient;

  vec2 v = st.zw;
  float sp = length(v);
  vec2 dir = sp > 0.001 ? v/sp : vec2(1.0,0.0);
  float r = uDot*hm.w*0.5;
  float len = min(sp*1.25, 18.0)*uStreak;
  vec2 lc = aCorner*vec2(r + len*0.5 + 1.0, r + 1.0);
  vec2 center = base - dir*len*0.5;
  vec2 world = center + dir*lc.x + vec2(-dir.y, dir.x)*lc.y;

  vec2 clip = world/uRes*2.0-1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLocal = lc;
  vHalfLen = len*0.5;
  vR = r;
  vec3 col = cl.rgb*uTint;
  float glint = smoothstep(2.0, 16.0, sp);
  col = mix(col, min(col*1.18 + vec3(0.07,0.075,0.085), vec3(1.0)), glint*0.75);
  vCol = col;
  vA = a;
}
`

const partFS = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vHalfLen;
in float vR;
in vec3 vCol;
in float vA;
uniform float uDpr;
out vec4 o;
void main(){
  vec2 q = vec2(max(abs(vLocal.x)-vHalfLen, 0.0), vLocal.y);
  float d = length(q) - vR;
  float a = clamp(0.5 - d*uDpr, 0.0, 1.0);
  float tail = vHalfLen > 0.0 ? clamp(0.5 - vLocal.x/(2.0*(vHalfLen+vR)), 0.0, 1.0) : 0.0;
  a *= 1.0 - tail*0.55;
  a *= vA;
  if(a < 0.004) discard;
  o = vec4(vCol*a, a);
}
`

const imgFS = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uImg;
uniform sampler2D uFlow;
uniform vec2 uRes;
uniform float uDpr;
uniform vec4 uRect;
uniform vec3 uBg;
uniform vec3 uImgBg;
uniform vec2 uMouse;
uniform float uPresence;
uniform float uRadius;
uniform float uStrength;
uniform float uTime;
uniform float uAmbient;
uniform float uIntroVis;
uniform float uRest;
uniform float uAlphaMode;
${noiseGLSL}
${energyGLSL}
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y)/uDpr;
  vec2 size = uRect.zw;
  vec2 uv = (px-uRect.xy)/size;
  if(uv.x < -0.05 || uv.x > 1.05 || uv.y < -0.12 || uv.y > 1.12){ o = vec4(0.0); return; }
  vec4 fl = texture(uFlow, clamp(uv,0.0,1.0));
  vec2 vel = (fl.rg*255.0-128.0)/127.0;
  vec2 rp = uv*size;
  vec2 toM = rp - uMouse;
  float fall = exp(-dot(toM,toM)/(uRadius*uRadius))*uPresence;
  vec2 disp = -toM*0.22*uStrength*fall - vel*10.0*uStrength;
  disp += ambientField(uv, uTime)*10.0*uAmbient;
  vec2 suv = uv + disp/size;
  vec4 tx = texture(uImg, suv);
  vec3 col = tx.rgb;
  vec2 e = smoothstep(vec2(0.0), vec2(0.004,0.01), suv) * smoothstep(vec2(1.0), vec2(0.996,0.99), suv);
  float key = uAlphaMode > 0.5 ? tx.a : smoothstep(0.012, 0.05, length(col-uImgBg));
  float k = key*e.x*e.y;
  float E = energyAt(rp, uMouse, uRadius, uPresence, fl.b);
  float show = (1.0 - max(E, uRest))*uIntroVis;
  vec3 mat = uAlphaMode > 0.5 ? col : col*(uBg/max(uImgBg, vec3(0.001)));
  float A = k*show;
  o = vec4(mat*A, A);
}
`

interface CompiledProgram {
  p: WebGLProgram
  u: Record<string, WebGLUniformLocation>
}

function compileProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): CompiledProgram {
  const makeShader = (type: number, src: string): WebGLShader => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s)
      gl.deleteShader(s)
      throw new Error('Shader compile failed: ' + log)
    }
    return s
  }

  const p = gl.createProgram()!
  const vs = makeShader(gl.VERTEX_SHADER, vsSource)
  const fs = makeShader(gl.FRAGMENT_SHADER, fsSource)
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.bindAttribLocation(p, 0, 'aPos')
  gl.linkProgram(p)
  gl.deleteShader(vs)
  gl.deleteShader(fs)

  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error('Link failed: ' + gl.getProgramInfoLog(p))
  }

  const uniforms: Record<string, WebGLUniformLocation> = {}
  const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(p, i)
    if (info) {
      const loc = gl.getUniformLocation(p, info.name)
      if (loc) uniforms[info.name] = loc
    }
  }

  return { p, u: uniforms }
}

const TEX_WIDTH = 1024
const SETTLE_LIMIT = 270

export interface EngineOptions {
  interactive: boolean
  strength: number
  radius: number
  density: number
  dotSize: number
  spread: number
  turbulence: number
  liquid: number
  streaks: boolean
  restStyle: 'image' | 'particles'
  returnSpeed: number
  ambient: boolean
  ambientIntensity: number
  speed: number
  intro: boolean
  reducedMotion: boolean
  bg: [number, number, number]
  imgBg: [number, number, number] | null
}

export interface RectLayout {
  x: number
  y: number
  w: number
  h: number
}

// --- Liquid Engine Class ---
class LiquidEngine {
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  opts: EngineOptions
  onFail: () => void
  onFirstFrame: (() => void) | null = null
  lastImage: HTMLImageElement | null = null
  lowPower = false
  stateFormat = { internal: 0, type: 0 }
  pFlow!: CompiledProgram
  pSim!: CompiledProgram
  pPart!: CompiledProgram
  pImg!: CompiledProgram
  vao!: WebGLVertexArrayObject
  quad!: WebGLBuffer
  imgTex: WebGLTexture | null = null
  flowTex: WebGLTexture[] = []
  flowFb: WebGLFramebuffer[] = []
  flowW = 256
  flowH = 104
  flowIdx = 0
  flowDirty = false
  homeTex: WebGLTexture | null = null
  colTex: WebGLTexture | null = null
  stateTex: WebGLTexture[] = []
  stateFb: WebGLFramebuffer[] = []
  stateIdx = 0
  texH = 1
  n = 0
  gridW = 1
  stateDirty = false
  alphaMode = false
  imgBg: [number, number, number] = [0.918, 0.914, 0.906]
  flowing = 0
  aspect = 2.5
  rect: RectLayout = { x: 0, y: 0, w: 1, h: 1 }
  cssW = 1
  cssH = 1
  target = { x: -9999, y: -9999 }
  mouse = { x: -9999, y: -9999 }
  prevMouse = { x: -9999, y: -9999 }
  mvel = { x: 0, y: 0 }
  presence = 0
  presenceTarget = 0
  burst = 0
  lastInput = -1e9
  settle = 1e9
  touchRelease = 0
  time = 0
  introT = 1
  raf = 0
  running = false
  last = 0
  skip = 0
  visible = true
  ready = false
  destroyed = false
  lost = false
  homeData: Float32Array | null = null

  private onLost = (e: Event) => {
    e.preventDefault()
    this.lost = true
    this.stop()
    this.onFail()
  }

  constructor(canvas: HTMLCanvasElement, opts: EngineOptions, onFail: () => void) {
    this.canvas = canvas
    this.opts = opts
    this.onFail = onFail

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    })

    if (!gl) {
      throw new Error('WebGL2 unavailable')
    }
    this.gl = gl

    const nav = navigator as Navigator & { deviceMemory?: number }
    this.lowPower =
      (nav.hardwareConcurrency || 8) <= 4 ||
      (nav.deviceMemory || 8) <= 4 ||
      window.matchMedia('(pointer: coarse)').matches

    this.initGL()
    canvas.addEventListener('webglcontextlost', this.onLost, false)
  }

  private initGL() {
    const gl = this.gl
    const ext = gl.getExtension('EXT_color_buffer_float')
    const halfExt = ext ? null : gl.getExtension('EXT_color_buffer_half_float')
    if (!ext && !halfExt) {
      throw new Error('No float render targets supported')
    }

    this.stateFormat = { internal: gl.RGBA16F, type: gl.HALF_FLOAT }
    this.pFlow = compileProgram(gl, quadVS, flowFS)
    this.pSim = compileProgram(gl, quadVS, simFS)
    this.pPart = compileProgram(gl, partVS, partFS)
    this.pImg = compileProgram(gl, quadVS, imgFS)

    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)
    this.quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    for (let i = 0; i < 2; i++) {
      const tex = this.makeTex(gl.RGBA8, this.flowW, this.flowH, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.LINEAR)
      const fb = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      this.flowTex.push(tex)
      this.flowFb.push(fb)
    }
    this.clearFlow()
  }

  private makeTex(
    internal: number,
    w: number,
    h: number,
    format: number,
    type: number,
    pixels: ArrayBufferView | null,
    filter: number
  ): WebGLTexture {
    const gl = this.gl
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, pixels as unknown as ArrayBufferView)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return tex
  }

  private clearFlow() {
    const gl = this.gl
    for (const fb of this.flowFb) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, this.flowW, this.flowH)
      gl.clearColor(128 / 255, 128 / 255, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.flowDirty = false
  }

  private clearState() {
    const gl = this.gl
    for (const fb of this.stateFb) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, TEX_WIDTH, this.texH)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.stateDirty = false
  }

  setImage(img: HTMLImageElement) {
    if (this.destroyed || this.lost) return
    const gl = this.gl
    this.lastImage = img
    this.aspect = img.naturalWidth / img.naturalHeight || 2.5
    this.flowH = Math.max(32, Math.round(this.flowW / this.aspect))

    for (const tex of this.flowTex) {
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.flowW, this.flowH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    }
    this.clearFlow()

    if (this.imgTex) gl.deleteTexture(this.imgTex)
    this.imgTex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    this.buildParticles(img)
    this.ready = true
    if (this.opts.intro && !this.opts.reducedMotion) {
      this.startIntro()
    }
    this.wake()
  }

  buildParticles(img: HTMLImageElement) {
    const gl = this.gl
    const baseW = this.lowPower ? 640 : 1000
    const w = Math.round(baseW * Math.sqrt(clamp(this.opts.density, 0.15, 2)))
    const h = Math.max(1, Math.round(w / this.aspect))
    this.gridW = w

    let pixels: Uint8ClampedArray
    try {
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      pixels = ctx.getImageData(0, 0, w, h).data
    } catch {
      throw new Error('Image is not CORS-readable')
    }

    let transparentCount = 0
    for (let i = 3; i < pixels.length; i += 4 * 7) {
      if (pixels[i] < 250) transparentCount++
    }
    this.alphaMode = transparentCount > pixels.length / (4 * 7) / 20

    if (this.opts.imgBg) {
      this.imgBg = this.opts.imgBg
    } else if (!this.alphaMode) {
      let rSum = 0, gSum = 0, bSum = 0, total = 0
      const cornerSize = Math.max(2, Math.round(w * 0.012))
      const corners = [
        [0, 0],
        [w - cornerSize, 0],
        [0, h - cornerSize],
        [w - cornerSize, h - cornerSize]
      ]
      for (const [cx, cy] of corners) {
        for (let py = cy; py < cy + cornerSize; py++) {
          for (let px = cx; px < cx + cornerSize; px++) {
            const idx = (py * w + px) * 4
            rSum += pixels[idx]
            gSum += pixels[idx + 1]
            bSum += pixels[idx + 2]
            total++
          }
        }
      }
      this.imgBg = [rSum / total / 255, gSum / total / 255, bSum / total / 255]
    }

    const home: number[] = []
    const colors: number[] = []

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const idx = (py * w + px) * 4
        const r = pixels[idx] / 255
        const g = pixels[idx + 1] / 255
        const b = pixels[idx + 2] / 255

        if (this.alphaMode) {
          const a = pixels[idx + 3] / 255
          if (a < 0.12 || (a < 0.5 && Math.random() > a * 2)) continue
        } else {
          const dist = Math.hypot(r - this.imgBg[0], g - this.imgBg[1], b - this.imgBg[2])
          if (dist < 0.03 || (dist < 0.07 && Math.random() > (dist - 0.03) / 0.04)) continue
        }

        const jx = (Math.random() - 0.5) * 0.6
        const jy = (Math.random() - 0.5) * 0.6
        home.push((px + 0.5 + jx) / w, (py + 0.5 + jy) / h, Math.random(), 0.85 + Math.random() * 0.3)
        colors.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], 255)
      }
    }

    const particleCount = home.length / 4
    this.n = particleCount
    this.texH = Math.max(1, Math.ceil(particleCount / TEX_WIDTH))
    const totalTexels = TEX_WIDTH * this.texH

    const homeFloats = new Float32Array(totalTexels * 4)
    homeFloats.set(home)
    const colorBytes = new Uint8Array(totalTexels * 4)
    colorBytes.set(colors)

    for (const t of [this.homeTex, this.colTex, ...this.stateTex]) {
      if (t) gl.deleteTexture(t)
    }
    for (const fb of this.stateFb) gl.deleteFramebuffer(fb)

    this.stateTex = []
    this.stateFb = []
    this.homeTex = this.makeTex(gl.RGBA32F, TEX_WIDTH, this.texH, gl.RGBA, gl.FLOAT, homeFloats, gl.NEAREST)
    this.colTex = this.makeTex(gl.RGBA8, TEX_WIDTH, this.texH, gl.RGBA, gl.UNSIGNED_BYTE, colorBytes, gl.NEAREST)

    for (let i = 0; i < 2; i++) {
      const tex = this.makeTex(this.stateFormat.internal, TEX_WIDTH, this.texH, gl.RGBA, this.stateFormat.type, null, gl.NEAREST)
      const fb = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Float FBO incomplete')
      }
      this.stateTex.push(tex)
      this.stateFb.push(fb)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    this.homeData = homeFloats
    this.clearState()
  }

  startIntro() {
    const gl = this.gl
    const h = this.homeData
    if (!h) return
    const width = this.rect.w > 10 ? this.rect.w : 1300
    const totalTexels = TEX_WIDTH * this.texH
    const stateFloats = new Float32Array(totalTexels * 4)

    for (let i = 0; i < this.n; i++) {
      const hx = h[i * 4] - 0.5
      const hy = h[i * 4 + 1] - 0.5
      const hz = h[i * 4 + 2]
      const angle = (Math.random() - 0.5) * 0.9 + (hx > 0 ? 0 : Math.PI)
      const dist = width * (0.04 + Math.random() * 0.14) * (0.5 + Math.abs(hx) * 1.4)
      stateFloats[i * 4] = Math.cos(angle) * dist + hx * width * 0.25 * hz
      stateFloats[i * 4 + 1] = Math.sin(angle) * dist * 0.55 + hy * 120 * (Math.random() - 0.5)
    }

    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.texImage2D(gl.TEXTURE_2D, 0, this.stateFormat.internal, TEX_WIDTH, this.texH, 0, gl.RGBA, gl.FLOAT, stateFloats)
    this.introT = 0
    this.stateDirty = true
  }

  setOptions(opts: Partial<EngineOptions>) {
    const reinit =
      (opts.density !== undefined && opts.density !== this.opts.density) ||
      (opts.imgBg !== undefined && String(opts.imgBg) !== String(this.opts.imgBg))

    this.opts = { ...this.opts, ...opts }

    if (reinit && this.ready && this.lastImage) {
      try {
        this.buildParticles(this.lastImage)
      } catch {
        this.onFail()
      }
    }
    this.wake()
  }

  resize(w: number, h: number, r: RectLayout) {
    this.cssW = Math.max(1, w)
    this.cssH = Math.max(1, h)
    this.rect = r

    let dpr = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.5 : 2)
    if (this.cssW * this.cssH * dpr * dpr > 4.5e6) {
      dpr = Math.max(1, Math.sqrt(4.5e6 / (this.cssW * this.cssH)))
    }

    const dw = Math.round(this.cssW * dpr)
    const dh = Math.round(this.cssH * dpr)
    if (this.canvas.width !== dw || this.canvas.height !== dh) {
      this.canvas.width = dw
      this.canvas.height = dh
    }
    this.draw()
  }

  setVisible(v: boolean) {
    this.visible = v
    if (v) this.wake()
    else this.stop()
  }

  pointer(type: 'move' | 'down' | 'up' | 'leave', px: number, py: number, isTouch: boolean) {
    if (!this.opts.interactive || this.lost) return
    const now = performance.now()
    if (type === 'leave' || type === 'up') {
      if (isTouch) this.touchRelease = now + 260
      else this.presenceTarget = 0
      this.wake()
      return
    }

    if (this.mouse.x < -9000 || type === 'down') {
      this.mouse.x = this.prevMouse.x = px
      this.mouse.y = this.prevMouse.y = py
    }

    this.target.x = px
    this.target.y = py
    this.presenceTarget = 1
    this.lastInput = now
    this.settle = 0

    if (type === 'down') {
      this.burst = 1
      this.touchRelease = 0
    }
    this.wake()
  }

  wake() {
    if (!this.ready || this.running || !this.visible || this.destroyed || this.lost) {
      if (this.ready && !this.running) this.draw()
      return
    }
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private radiusPx(): number {
    return this.opts.radius * clamp(this.rect.w / 1400, 0.6, 1.25)
  }

  private strength(): number {
    return this.opts.strength * (this.opts.reducedMotion ? 0.5 : 1)
  }

  private firstFrame() {
    if (this.onFirstFrame) {
      const cb = this.onFirstFrame
      this.onFirstFrame = null
      requestAnimationFrame(() => cb())
    }
  }

  private frame = (time: number) => {
    if (!this.running) return
    const dt = time - this.last
    const step = clamp(dt / 16.6667, 0.25, 3)
    this.last = time
    const opts = this.opts
    const isAmbient = opts.ambient && !opts.reducedMotion

    if (this.touchRelease && time > this.touchRelease) {
      this.presenceTarget = 0
      this.touchRelease = 0
    }

    const mouseAlpha = 1 - Math.pow(1 - 0.22, step)
    this.mouse.x += (this.target.x - this.mouse.x) * mouseAlpha
    this.mouse.y += (this.target.y - this.mouse.y) * mouseAlpha

    const vx = (this.mouse.x - this.prevMouse.x) / step
    const vy = (this.mouse.y - this.prevMouse.y) / step
    this.prevMouse.x = this.mouse.x
    this.prevMouse.y = this.mouse.y

    this.mvel.x += (clamp(vx, -60, 60) - this.mvel.x) * 0.5
    this.mvel.y += (clamp(vy, -60, 60) - this.mvel.y) * 0.5

    const presenceRate = this.presenceTarget > this.presence ? 0.1 : 0.035
    this.presence += (this.presenceTarget - this.presence) * (1 - Math.pow(1 - presenceRate, step))
    if (this.presence < 0.001 && this.presenceTarget === 0) this.presence = 0

    const flowRate = this.presenceTarget > this.flowing ? 0.05 : 0.018
    this.flowing += (this.presenceTarget - this.flowing) * (1 - Math.pow(1 - flowRate, step))
    if (this.flowing < 0.002 && this.presenceTarget === 0) this.flowing = 0

    if (this.introT < 1) {
      this.introT = Math.min(1, this.introT + Math.min(dt, 100) / 3200)
    }

    const isDisturbed = this.presence > 0.001 || this.burst > 0
    this.settle = isDisturbed ? 0 : this.settle + step

    if (!isDisturbed && this.settle >= SETTLE_LIMIT && this.introT >= 1) {
      if (this.flowDirty) this.clearFlow()
      if (this.stateDirty) this.clearState()

      if (!isAmbient) {
        this.draw()
        this.firstFrame()
        this.stop()
        return
      }

      this.raf = requestAnimationFrame(this.frame)
      if (this.skip++ % 2) return
      this.time += (step * 2 * opts.speed) / 60
      this.draw()
      this.firstFrame()
      return
    }

    this.raf = requestAnimationFrame(this.frame)
    this.time += (step * opts.speed * (1 + this.flowing * 1.6)) / 60
    this.stepFlow(step)
    this.stepSim(step)
    this.burst = Math.max(0, this.burst - 0.1 * step)
    this.draw()
    this.firstFrame()
  }

  private stepFlow(step: number) {
    const gl = this.gl
    const prog = this.pFlow
    const nextIdx = 1 - this.flowIdx

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.flowFb[nextIdx])
    gl.viewport(0, 0, this.flowW, this.flowH)
    gl.disable(gl.BLEND)
    gl.useProgram(prog.p)
    gl.bindVertexArray(this.vao)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(prog.u.uPrev, 0)
    gl.uniform2f(prog.u.uTexel, 1 / this.flowW, 1 / this.flowH)

    const r = this.rect
    gl.uniform2f(prog.u.uMouse, (this.mouse.x - r.x) / r.w, (this.mouse.y - r.y) / r.h)
    gl.uniform2f(prog.u.uVel, clamp(this.mvel.x / 40, -1, 1), clamp(this.mvel.y / 40, -1, 1))
    gl.uniform2f(prog.u.uSize, r.w, r.h)
    gl.uniform1f(prog.u.uRadius, this.radiusPx())
    gl.uniform1f(prog.u.uPresence, Math.max(this.presence, this.burst))
    gl.uniform1f(prog.u.uDecay, Math.pow(0.968, step))

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.flowIdx = nextIdx
    this.flowDirty = true
  }

  private stepSim(step: number) {
    if (!this.n) return
    const gl = this.gl
    const prog = this.pSim
    const opts = this.opts
    const r = this.rect
    const nextIdx = 1 - this.stateIdx
    const introVal = opts.reducedMotion || !opts.intro ? 0 : Math.pow(1 - this.introT, 2)

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.stateFb[nextIdx])
    gl.viewport(0, 0, TEX_WIDTH, this.texH)
    gl.disable(gl.BLEND)
    gl.useProgram(prog.p)
    gl.bindVertexArray(this.vao)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.uniform1i(prog.u.uState, 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.homeTex)
    gl.uniform1i(prog.u.uHome, 1)

    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(prog.u.uFlow, 2)

    gl.uniform2f(prog.u.uSize, r.w, r.h)
    gl.uniform2f(prog.u.uMouse, this.mouse.x - r.x, this.mouse.y - r.y)
    gl.uniform1f(prog.u.uRadius, this.radiusPx())
    gl.uniform1f(prog.u.uPresence, Math.max(this.presence, this.burst))
    gl.uniform1f(prog.u.uStrength, this.strength() * (1 + this.burst * 1.5))
    gl.uniform1f(prog.u.uSpread, clamp(opts.spread, 0, 2))
    gl.uniform1f(prog.u.uTurb, clamp(opts.turbulence, 0, 2) * (opts.reducedMotion ? 0.3 : 1))
    gl.uniform1f(prog.u.uReturn, clamp(opts.returnSpeed, 0, 2))
    gl.uniform1f(prog.u.uTime, this.time)
    gl.uniform1f(prog.u.uDt, step)
    gl.uniform1f(prog.u.uIntro, introVal)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.stateIdx = nextIdx
    this.stateDirty = true
  }

  draw() {
    if (!this.ready || this.lost || this.destroyed) return
    const gl = this.gl
    const opts = this.opts
    const r = this.rect
    const isReduced = opts.reducedMotion
    const introVis = isReduced || !opts.intro ? 1 : Math.pow(this.introT, 2.2)
    const ambientFlow =
      (opts.ambient && !isReduced ? clamp(opts.ambientIntensity, 0, 2) : 0) +
      this.flowing * 0.85 * clamp(opts.liquid, 0, 2) * (isReduced ? 0.3 : 1)
    const restPart = opts.restStyle === 'particles' ? 1 : 0
    const [bgR, bgG, bgB] = opts.bg
    const [imgR, imgG, imgB] = this.imgBg
    const dpr = this.canvas.width / this.cssW
    const pres = Math.max(this.presence, this.burst)
    const mx = this.mouse.x - r.x
    const my = this.mouse.y - r.y

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.bindVertexArray(this.vao)
    gl.disable(gl.BLEND)

    // 1. Draw base image
    const progImg = this.pImg
    gl.useProgram(progImg.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex)
    gl.uniform1i(progImg.u.uImg, 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(progImg.u.uFlow, 1)

    gl.uniform2f(progImg.u.uRes, this.cssW, this.cssH)
    gl.uniform1f(progImg.u.uDpr, dpr)
    gl.uniform4f(progImg.u.uRect, r.x, r.y, r.w, r.h)
    gl.uniform3f(progImg.u.uBg, bgR, bgG, bgB)
    gl.uniform3f(progImg.u.uImgBg, imgR, imgG, imgB)
    gl.uniform2f(progImg.u.uMouse, mx, my)
    gl.uniform1f(progImg.u.uPresence, pres)
    gl.uniform1f(progImg.u.uRadius, this.radiusPx())
    gl.uniform1f(progImg.u.uStrength, this.strength())
    gl.uniform1f(progImg.u.uTime, this.time)
    gl.uniform1f(progImg.u.uAmbient, ambientFlow)
    gl.uniform1f(progImg.u.uIntroVis, introVis)
    gl.uniform1f(progImg.u.uRest, restPart)
    gl.uniform1f(progImg.u.uAlphaMode, this.alphaMode ? 1 : 0)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    if (!this.n || (!this.stateDirty && restPart === 0 && introVis >= 1)) {
      return
    }

    // 2. Draw instanced particles
    const progPart = this.pPart
    gl.useProgram(progPart.p)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.uniform1i(progPart.u.uState, 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.homeTex)
    gl.uniform1i(progPart.u.uHome, 1)

    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.colTex)
    gl.uniform1i(progPart.u.uCol, 2)

    gl.activeTexture(gl.TEXTURE3)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(progPart.u.uFlow, 3)

    gl.uniform1i(progPart.u.uTexW, TEX_WIDTH)
    gl.uniform4f(progPart.u.uRect, r.x, r.y, r.w, r.h)
    gl.uniform2f(progPart.u.uRes, this.cssW, this.cssH)
    gl.uniform2f(progPart.u.uMouse, mx, my)
    gl.uniform1f(progPart.u.uRadius, this.radiusPx())
    gl.uniform1f(progPart.u.uPresence, pres)

    const cellW = r.w / this.gridW
    gl.uniform1f(progPart.u.uDot, cellW * 1.45 * clamp(opts.dotSize, 0.2, 3))
    gl.uniform1f(progPart.u.uTime, this.time)
    gl.uniform1f(progPart.u.uAmbient, ambientFlow)
    gl.uniform1f(progPart.u.uStreak, (opts.streaks ? 1 : 0) * (0.45 + 0.55 * introVis))
    gl.uniform1f(progPart.u.uIntroVis, introVis)
    gl.uniform1f(progPart.u.uRest, restPart)
    gl.uniform1f(progPart.u.uDpr, dpr)

    if (this.alphaMode) {
      gl.uniform3f(progPart.u.uTint, 1, 1, 1)
    } else {
      gl.uniform3f(
        progPart.u.uTint,
        bgR / Math.max(imgR, 0.001),
        bgG / Math.max(imgG, 0.001),
        bgB / Math.max(imgB, 0.001)
      )
    }

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.n)
    gl.disable(gl.BLEND)
  }

  destroy() {
    this.destroyed = true
    this.stop()
    this.canvas.removeEventListener('webglcontextlost', this.onLost)

    const gl = this.gl
    if (!this.lost) {
      gl.deleteBuffer(this.quad)
      gl.deleteVertexArray(this.vao)
      for (const t of [...this.flowTex, ...this.stateTex, this.imgTex, this.homeTex, this.colTex]) {
        if (t) gl.deleteTexture(t)
      }
      for (const fb of [...this.flowFb, ...this.stateFb]) {
        if (fb) gl.deleteFramebuffer(fb)
      }
      for (const p of [this.pFlow, this.pSim, this.pPart, this.pImg]) {
        if (p) gl.deleteProgram(p.p)
      }
    }

    const loseExt = gl.getExtension('WEBGL_lose_context')
    loseExt?.loseContext()
  }
}

// --- Layout Calculation Helper ---
function computeRect(
  containerW: number,
  containerH: number,
  aspect: number,
  bounds: { top: number; bottom: number },
  transforms: { scale: number; mobileScale: number; x: number; y: number }
): RectLayout {
  const availH = Math.max(80, bounds.bottom - bounds.top)
  let w: number
  let h: number

  if (containerW >= 1024) {
    w = containerW * 1.02 * transforms.scale
    h = availH * 1.1 * transforms.scale
  } else if (containerW >= 640) {
    w = containerW * 1.3 * transforms.scale
    h = availH * 1.15 * transforms.scale
  } else if (aspect < 1.3) {
    w = containerW * 1.0 * transforms.mobileScale
    h = availH * 1.0 * transforms.mobileScale
  } else {
    w = containerW * 1.9 * transforms.mobileScale
    h = availH * 1.2 * transforms.mobileScale
  }

  if (w / aspect > h) {
    w = h * aspect
  }
  const computedH = w / aspect
  const cx = containerW * (0.5 + transforms.x / 100)
  const cy = (bounds.top + bounds.bottom) / 2 + containerH * (transforms.y / 100)

  return {
    x: cx - w / 2,
    y: cy - computedH / 2,
    w,
    h: computedH,
  }
}

// --- Component Styles ---
const heroCSS = `
.sh-root {
  position: relative;
  width: 100%;
  height: var(--sh-h);
  overflow: hidden;
  isolation: isolate;
  container-type: size;
  transition: background-color .6s ease, color .6s ease;
  background: var(--sh-bg);
  color: var(--sh-fg);
  font-family: var(--sh-body);
  -webkit-font-smoothing: antialiased;
  touch-action: pan-y;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.sh-root *, .sh-root *::before, .sh-root *::after {
  box-sizing: border-box;
}
.sh-stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.sh-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  transition: opacity .5s ease;
  pointer-events: none;
}
.sh-fallback {
  position: absolute;
  display: block;
  max-width: none;
  user-select: none;
  -webkit-user-drag: none;
  transition: opacity .5s ease;
  pointer-events: none;
}
.sh-root[data-gl="on"] .sh-canvas {
  opacity: 1;
}
.sh-root[data-gl="on"] .sh-fallback {
  opacity: 0;
}
.sh-root[data-swap="1"] .sh-canvas {
  opacity: 0;
  transition-duration: .25s;
}
.sh-root[data-swap="1"] .sh-fallback {
  opacity: 0;
  transition-duration: .25s;
}
.sh-backdrop {
  position: absolute;
  left: 50%;
  z-index: 0;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  font-family: var(--sh-head);
  font-weight: 700;
  letter-spacing: -.06em;
  line-height: .8;
  color: color-mix(in srgb, var(--sh-fg) 4%, transparent);
}
.sh-nav {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 26px clamp(20px, 3.2cqw, 48px) 0;
}
.sh-brand {
  font-family: var(--sh-head);
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -.02em;
  color: inherit;
  text-decoration: none;
}
.sh-links {
  display: flex;
  align-items: center;
  gap: clamp(18px, 2.4cqw, 36px);
  list-style: none;
  margin: 0;
  padding: 0;
}
.sh-link {
  color: inherit;
  text-decoration: none;
  font-size: 13.5px;
  letter-spacing: -.005em;
  opacity: .75;
  transition: opacity .2s;
}
.sh-link:hover {
  opacity: 1;
}
.sh-theme {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  color: inherit;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--sh-fg) 22%, transparent);
  transition: background .25s, color .25s;
}
.sh-theme:hover {
  background: var(--sh-fg);
  color: var(--sh-bg);
}
.sh-theme:focus-visible {
  outline: 2px solid var(--sh-fg);
  outline-offset: 4px;
}
.sh-navcta {
  color: inherit;
  text-decoration: none;
  font-size: 13.5px;
  padding: 8px 14px;
  border: 1px solid color-mix(in srgb, var(--sh-fg) 22%, transparent);
  border-radius: 999px;
  transition: background .25s, color .25s;
  cursor: pointer;
}
.sh-navcta:hover {
  background: var(--sh-fg);
  color: var(--sh-bg);
}
.sh-hint {
  position: absolute;
  z-index: 5;
  transform: translate(-50%, 0);
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  opacity: .5;
  pointer-events: none;
  transition: opacity .8s ease;
}
.sh-hint::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: sh-pulse 2.4s ease-in-out infinite;
}
.sh-root[data-touched="1"] .sh-hint {
  opacity: 0;
}
@keyframes sh-pulse {
  0%, 100% { transform: scale(.6); opacity: .45; }
  50% { transform: scale(1); opacity: 1; }
}
.sh-spacer {
  flex: 1 1 auto;
  min-height: 0;
}
.sh-content {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  align-items: end;
  gap: clamp(24px, 4cqw, 72px);
  padding: 0 clamp(20px, 3.2cqw, 48px) clamp(28px, 3.4cqw, 52px);
}
.sh-eyebrow {
  font-size: 12px;
  letter-spacing: .14em;
  text-transform: uppercase;
  opacity: .75;
  margin: 0 0 clamp(14px, 1.6cqw, 22px);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
}
.sh-eyebrow::before {
  content: "";
  width: 28px;
  height: 1.5px;
  background: currentColor;
  opacity: .8;
}
.sh-h1 {
  font-family: var(--sh-head);
  font-weight: 600;
  font-size: clamp(40px, min(6.6cqw, 11.5cqh), 116px);
  line-height: .94;
  letter-spacing: -.045em;
  margin: 0;
  text-wrap: balance;
}
.sh-h1 .sh-line {
  display: block;
}
.sh-accent {
  font-family: var(--sh-accent);
  font-style: italic;
  font-weight: 500;
  letter-spacing: -.02em;
  color: var(--sh-acc);
}
.sh-aside {
  max-width: 440px;
  justify-self: end;
  padding-bottom: .6em;
}
.sh-body {
  font-size: clamp(15px, 1.1cqw, 17px);
  line-height: 1.55;
  letter-spacing: -.01em;
  margin: 0 0 26px;
  opacity: .82;
  text-wrap: pretty;
}
.sh-ctas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}
.sh-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 24px;
  border-radius: 999px;
  background: var(--sh-fg);
  color: var(--sh-bg);
  text-decoration: none;
  font-size: 14.5px;
  font-weight: 600;
  letter-spacing: -.01em;
  transition: transform .3s cubic-bezier(.2,.7,.2,1), opacity .2s, box-shadow .2s;
  box-shadow: 0 4px 14px 0 rgba(0,0,0,0.25);
  cursor: pointer;
  border: none;
}
.sh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
}
.sh-btn svg, .sh-txt svg {
  transition: transform .3s cubic-bezier(.2,.7,.2,1);
}
.sh-btn:hover svg, .sh-txt:hover svg {
  transform: translateX(4px);
}
.sh-txt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;
  font-size: 14.5px;
  font-weight: 500;
  letter-spacing: -.01em;
  padding: 6px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--sh-fg) 35%, transparent);
  cursor: pointer;
  background: transparent;
  border-top: none;
  border-left: none;
  border-right: none;
}
.sh-txt:hover {
  opacity: .95;
  border-bottom-color: var(--sh-fg);
}
.sh-root a:focus-visible, .sh-root button:focus-visible {
  outline: 2px solid var(--sh-acc);
  outline-offset: 4px;
}
.sh-credit {
  position: absolute;
  z-index: 10;
  right: clamp(20px, 3.2cqw, 48px);
  bottom: 10px;
  font-size: 10px;
  letter-spacing: .06em;
  color: inherit;
  opacity: .35;
  text-decoration: none;
}
.sh-credit:hover {
  opacity: .8;
}

@container (max-width: 1023px) {
  .sh-content {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .sh-aside {
    justify-self: start;
    max-width: 520px;
    padding-bottom: 0;
  }
  .sh-h1 {
    font-size: clamp(38px, min(9.5cqw, 9cqh), 88px);
  }
}
@container (max-width: 767px) {
  .sh-links li:not(.sh-keep) {
    display: none;
  }
}
@container (max-width: 639px) {
  .sh-nav {
    padding-top: 18px;
  }
  .sh-h1 {
    font-size: clamp(34px, min(12.5cqw, 7.2cqh), 56px);
    line-height: .96;
  }
  .sh-body {
    font-size: 14.5px;
    margin-bottom: 20px;
  }
  .sh-eyebrow {
    font-size: 11px;
  }
  .sh-ctas {
    gap: 16px;
  }
  .sh-btn {
    height: 44px;
    padding: 0 20px;
  }
  .sh-content {
    padding-bottom: 36px;
  }
  .sh-credit {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sh-hint::before {
    animation: none;
  }
  .sh-canvas, .sh-fallback, .sh-btn, .sh-btn svg, .sh-txt svg {
    transition: none !important;
  }
}
`

export interface HeroCta {
  label: string
  href?: string
  onClick?: () => void
}

// Default Props
const DEFAULT_HERO: {
  src: string
  darkSrc: string
  mobileSrc: string
  mobileDarkSrc: string
  imageAlt: string
  brand: string
  navLinks: Array<{ label: string; href: string }>
  navCta: HeroCta
  eyebrow: string
  headline: string
  headlineAccent: string
  body: string
  primaryCta: HeroCta
  secondaryCta: HeroCta
  hint: string
  hintTouch: string
  background: string
  darkBackground: string
  textColor: string
  accentColor: string
  headingFont: string
  accentFont: string
  bodyFont: string
} = {
  src: '/assets/sculpture/sculpture-light.webp',
  darkSrc: '/assets/sculpture/sculpture-dark.webp',
  mobileSrc: '/assets/sculpture/sculpture-mobile.webp',
  mobileDarkSrc: '/assets/sculpture/sculpture-mobile-dark.webp',
  imageAlt: 'Interactive Liquid Sculpture visual for Smart Hub',
  brand: 'Smart Hub',
  navLinks: [
    { label: 'Academics', href: '#academics' },
    { label: 'Coding Hub', href: '#coding-hub' },
    { label: 'Projects', href: '#projects' },
    { label: 'Placements', href: '#placements' },
  ],
  navCta: { label: 'Portals', href: '#portals-section' },
  eyebrow: 'GEETHANJALI INSTITUTE OF SCIENCE AND TECHNOLOGY',
  headline: `Build. Learn.
Innovate.`,
  headlineAccent: 'Innovate.',
  body: "Your department's digital hub for academic resources, coding practice, student projects, placement preparation, and department updates.",
  primaryCta: { label: 'Explore Smart Hub', href: '#academics' },
  secondaryCta: { label: 'Student & Faculty Portal', href: '#portals-section' },
  hint: 'Interact with the sculpture',
  hintTouch: 'Touch the sculpture',
  background: '#090d16',
  darkBackground: '#090d16',
  textColor: '#f8fafc',
  accentColor: '#3b82f6',
  headingFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  accentFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  bodyFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

let fontInjected = false
function injectFonts() {
  if (fontInjected || typeof document === 'undefined') return
  fontInjected = true
  const id = 'sh-fonts'
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href =
    'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap'
  document.head.appendChild(link)
}

function renderHeadline(text: string, accent?: string) {
  return text.split('\n').map((line, idx) => {
    let content: React.ReactNode = line
    const acc = accent && accent.trim()
    if (acc) {
      const matchIdx = line.indexOf(acc)
      if (matchIdx >= 0) {
        content = (
          <React.Fragment>
            {line.slice(0, matchIdx)}
            <span className="sh-accent">{acc}</span>
            {line.slice(matchIdx + acc.length)}
          </React.Fragment>
        )
      }
    }
    return (
      <span key={idx} className="sh-line">
        {content}
      </span>
    )
  })
}

// Icons
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M3.2 12.8l1.1-1.1M11.7 4.3l1.1-1.1"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
)

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.6 10.1A5.9 5.9 0 0 1 5.9 2.4a5.9 5.9 0 1 0 7.7 7.7Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
)

export interface SculptureHeroProps {
  src?: string
  darkSrc?: string
  mobileSrc?: string
  mobileDarkSrc?: string
  imageAlt?: string
  imageBackground?: string
  brand?: string
  navLinks?: Array<{ label: string; href: string }>
  navCta?: HeroCta
  showNav?: boolean
  eyebrow?: string
  headline?: string
  headlineAccent?: string
  body?: string
  primaryCta?: HeroCta
  secondaryCta?: HeroCta
  hint?: string
  hintTouch?: string
  background?: string
  darkBackground?: string
  theme?: 'light' | 'dark'
  themeToggle?: boolean
  textColor?: string
  accentColor?: string
  headingFont?: string
  accentFont?: string
  bodyFont?: string
  loadFonts?: boolean
  sculptureScale?: number
  mobileSculptureScale?: number
  sculptureX?: number
  sculptureY?: number
  interactive?: boolean
  strength?: number
  radius?: number
  particleDensity?: number
  particleSpread?: number
  dotSize?: number
  turbulence?: number
  liquid?: number
  streaks?: boolean
  restStyle?: 'image' | 'particles'
  returnSpeed?: number
  ambient?: boolean
  ambientIntensity?: number
  speed?: number
  intro?: boolean
  height?: string
  backdropText?: string
  showCredit?: boolean
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function LiquidSculptureHero(props: SculptureHeroProps) {
  const {
    src = DEFAULT_HERO.src,
    darkSrc = DEFAULT_HERO.darkSrc,
    mobileSrc = DEFAULT_HERO.mobileSrc,
    mobileDarkSrc = DEFAULT_HERO.mobileDarkSrc,
    imageAlt = DEFAULT_HERO.imageAlt,
    imageBackground,
    brand = DEFAULT_HERO.brand,
    navLinks = DEFAULT_HERO.navLinks,
    navCta = DEFAULT_HERO.navCta,
    showNav = false,
    eyebrow = DEFAULT_HERO.eyebrow,
    headline = DEFAULT_HERO.headline,
    headlineAccent = DEFAULT_HERO.headlineAccent,
    body = DEFAULT_HERO.body,
    primaryCta = DEFAULT_HERO.primaryCta,
    secondaryCta = DEFAULT_HERO.secondaryCta,
    hint = DEFAULT_HERO.hint,
    hintTouch = DEFAULT_HERO.hintTouch,
    background = DEFAULT_HERO.background,
    darkBackground = DEFAULT_HERO.darkBackground,
    theme = 'dark',
    themeToggle = false,
    textColor,
    accentColor,
    headingFont = DEFAULT_HERO.headingFont,
    accentFont = DEFAULT_HERO.accentFont,
    bodyFont = DEFAULT_HERO.bodyFont,
    loadFonts = true,
    sculptureScale = 1,
    mobileSculptureScale = 1,
    sculptureX = 0,
    sculptureY = 0,
    interactive = true,
    strength = 1,
    radius = 220,
    particleDensity = 1,
    particleSpread = 1,
    dotSize = 1,
    turbulence = 1,
    liquid = 1,
    streaks = true,
    restStyle = 'image',
    returnSpeed = 1,
    ambient = false,
    ambientIntensity = 1,
    speed = 1,
    intro = false,
    height = 'auto',
    backdropText = 'SMART HUB',
    showCredit = false,
    className,
    style,
    children,
  } = props

  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const fallbackRef = useRef<HTMLImageElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<LiquidEngine | null>(null)
  const aspectRef = useRef<number>(1983 / 793)

  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(null)
  const currentTheme = themeOverride ?? theme
  const [isMobile, setIsMobile] = useState(false)
  const mobileRef = useRef(false)

  const transformsRef = useRef({
    scale: clamp(sculptureScale, 0.3, 3),
    mobileScale: clamp(mobileSculptureScale, 0.3, 3),
    x: sculptureX,
    y: sculptureY,
  })

  useEffect(() => {
    transformsRef.current = {
      scale: clamp(sculptureScale, 0.3, 3),
      mobileScale: clamp(mobileSculptureScale, 0.3, 3),
      x: sculptureX,
      y: sculptureY,
    }
  }, [sculptureScale, mobileSculptureScale, sculptureX, sculptureY])

  const activeBg = currentTheme === 'dark' ? darkBackground : background
  const bgRgb = useMemo(() => hexToRgb(activeBg, [0.035, 0.05, 0.086]), [activeBg])
  const isDarkBg = bgRgb[0] * 0.2126 + bgRgb[1] * 0.7152 + bgRgb[2] * 0.0722 < 0.45
  const fgColor = textColor || (isDarkBg ? '#f8fafc' : '#151514')
  const accColor = accentColor || (isDarkBg ? '#3b82f6' : '#2563eb')
  const imgBgRgb = useMemo(() => (imageBackground ? hexToRgb(imageBackground, [0.918, 0.914, 0.906]) : null), [imageBackground])

  // Resolve responsive/theme image source
  const activeImageSrc =
    isMobile && currentTheme === 'dark' && (mobileDarkSrc || darkSrc)
      ? mobileDarkSrc || darkSrc
      : isMobile && currentTheme === 'light' && mobileSrc
      ? mobileSrc
      : currentTheme === 'dark' && darkSrc
      ? darkSrc
      : src

  const makeEngineOpts = useCallback(
    (reducedMotion: boolean): EngineOptions => ({
      interactive,
      strength: clamp(strength, 0, 2),
      radius: clamp(radius, 40, 600),
      density: clamp(particleDensity, 0.15, 2),
      dotSize: clamp(dotSize, 0.2, 3),
      spread: clamp(particleSpread, 0, 2),
      turbulence: clamp(turbulence, 0, 2),
      liquid: clamp(liquid, 0, 2),
      streaks,
      restStyle,
      returnSpeed: clamp(returnSpeed, 0, 2),
      ambient,
      ambientIntensity: clamp(ambientIntensity, 0, 2),
      speed: clamp(speed, 0.25, 3),
      intro,
      reducedMotion,
      bg: bgRgb,
      imgBg: imgBgRgb,
    }),
    [
      interactive,
      strength,
      radius,
      particleDensity,
      dotSize,
      particleSpread,
      turbulence,
      liquid,
      streaks,
      restStyle,
      returnSpeed,
      ambient,
      ambientIntensity,
      speed,
      intro,
      bgRgb,
      imgBgRgb,
    ]
  )

  const engineOptsRef = useRef(makeEngineOpts)
  useEffect(() => {
    engineOptsRef.current = makeEngineOpts
  }, [makeEngineOpts])

  useEffect(() => {
    if (loadFonts) injectFonts()
  }, [loadFonts])

  // Responsive Layout Update
  const updateLayout = useCallback(() => {
    const root = rootRef.current
    if (!root) return

    const clientW = root.clientWidth
    const clientH = root.clientHeight
    const isCoarse = clientW < 640

    if (isCoarse !== mobileRef.current) {
      mobileRef.current = isCoarse
      setIsMobile(isCoarse)
    }

    const nav = navRef.current
    const content = contentRef.current
    const bounds = {
      top: nav ? nav.offsetTop + nav.offsetHeight + 8 : 16,
      bottom: content ? content.offsetTop - 8 : clientH,
    }

    if (isCoarse && aspectRef.current < 1.3 && content) {
      bounds.bottom += content.offsetHeight * 0.3
    }

    const rect = computeRect(clientW, clientH, aspectRef.current, bounds, transformsRef.current)

    const backdrop = backdropRef.current
    if (backdrop) {
      const len = Math.max(1, (backdrop.textContent || '').length)
      backdrop.style.fontSize = Math.min((bounds.bottom - bounds.top) * 0.95, (clientW * 0.92) / (len * 0.56)) + 'px'
      backdrop.style.top = (bounds.top + bounds.bottom) / 2 + 'px'
    }

    const fallback = fallbackRef.current
    if (fallback) {
      fallback.style.left = rect.x + 'px'
      fallback.style.top = rect.y + 'px'
      fallback.style.width = rect.w + 'px'
      fallback.style.height = rect.h + 'px'
    }

    const hintEl = hintRef.current
    if (hintEl) {
      hintEl.style.display = isCoarse && aspectRef.current < 1.3 ? 'none' : ''
      hintEl.style.left = clamp(rect.x + rect.w / 2, 80, clientW - 80) + 'px'
      hintEl.style.top = Math.min(rect.y + rect.h * 0.95, bounds.bottom - 20) + 'px'
    }

    engineRef.current?.resize(clientW, clientH, rect)
  }, [])

  // WebGL Canvas and Engine Lifecycle
  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return

    const canvas = document.createElement('canvas')
    canvas.className = 'sh-canvas'
    stage.appendChild(canvas)

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointerQuery = window.matchMedia('(hover: none), (pointer: coarse)')
    setIsTouchDevice(pointerQuery.matches)

    let engine: LiquidEngine | null = null
    const fail = () => {
      root.dataset.gl = 'off'
    }

    try {
      engine = new LiquidEngine(canvas, engineOptsRef.current(motionQuery.matches), fail)
      engineRef.current = engine
    } catch {
      fail()
    }

    const resizeObserver = new ResizeObserver(() => updateLayout())
    resizeObserver.observe(root)
    if (navRef.current) resizeObserver.observe(navRef.current)
    if (contentRef.current) resizeObserver.observe(contentRef.current)

    const intersectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        engine?.setVisible(entry.isIntersecting && !document.hidden)
      }
    })
    intersectionObserver.observe(root)

    const handleVisibility = () => {
      engine?.setVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const handleMotionChange = () => {
      engine?.setOptions({ reducedMotion: motionQuery.matches })
    }
    motionQuery.addEventListener?.('change', handleMotionChange)

    const getLocalPos = (e: PointerEvent): [number, number] => {
      const b = root.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }

    let hasTouched = false
    const markTouched = () => {
      if (!hasTouched) {
        hasTouched = true
        root.dataset.touched = '1'
      }
    }

    const onMove = (e: PointerEvent) => {
      const [px, py] = getLocalPos(e)
      const isTouch = e.pointerType === 'touch'
      if (isTouch && e.buttons === 0 && e.pressure === 0) return
      engine?.pointer('move', px, py, isTouch)
      markTouched()
    }

    const onDown = (e: PointerEvent) => {
      const [px, py] = getLocalPos(e)
      engine?.pointer('down', px, py, e.pointerType === 'touch')
      markTouched()
    }

    const onUp = (e: PointerEvent) => {
      const [px, py] = getLocalPos(e)
      engine?.pointer('up', px, py, e.pointerType === 'touch')
    }

    const onLeave = (e: PointerEvent) => {
      const [px, py] = getLocalPos(e)
      engine?.pointer('leave', px, py, e.pointerType === 'touch')
    }

    root.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('pointerdown', onDown, { passive: true })
    root.addEventListener('pointerup', onUp, { passive: true })
    root.addEventListener('pointercancel', onUp, { passive: true })
    root.addEventListener('pointerleave', onLeave, { passive: true })

    return () => {
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
      motionQuery.removeEventListener?.('change', handleMotionChange)

      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerdown', onDown)
      root.removeEventListener('pointerup', onUp)
      root.removeEventListener('pointercancel', onUp)
      root.removeEventListener('pointerleave', onLeave)

      engine?.destroy()
      engineRef.current = null
      canvas.remove()
      delete root.dataset.gl
    }
  }, [updateLayout])

  // Image Loading and Swapping
  useEffect(() => {
    const root = rootRef.current
    const engine = engineRef.current
    if (!root) return

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'

    const isGlActive = root.dataset.gl === 'on'
    if (isGlActive) root.dataset.swap = '1'

    img.onload = () => {
      if (cancelled) return
      aspectRef.current = img.naturalWidth / img.naturalHeight || aspectRef.current
      updateLayout()

      if (engine && root.dataset.gl !== 'off') {
        try {
          engine.onFirstFrame = () => {
            if (!cancelled) {
              root.dataset.gl = 'on'
              delete root.dataset.swap
            }
          }
          engine.setImage(img)
          updateLayout()
        } catch {
          root.dataset.gl = 'off'
        }
      } else {
        delete root.dataset.swap
      }
    }

    img.onerror = () => {
      delete root.dataset.swap
    }

    const timer = window.setTimeout(() => {
      img.src = activeImageSrc
    }, isGlActive ? 280 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      img.onload = null
      img.onerror = null
    }
  }, [activeImageSrc, updateLayout])

  // Update dynamic engine options
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    engine.setOptions(engineOptsRef.current(isReduced))
  }, [
    interactive,
    strength,
    radius,
    particleDensity,
    dotSize,
    particleSpread,
    turbulence,
    liquid,
    streaks,
    restStyle,
    returnSpeed,
    ambient,
    ambientIntensity,
    speed,
    intro,
    bgRgb,
    imgBgRgb,
  ])

  useEffect(() => {
    updateLayout()
  }, [sculptureScale, mobileSculptureScale, sculptureX, sculptureY, updateLayout])

  const rootStyleVars: Record<string, string | number> = {
    '--sh-bg': activeBg,
    '--sh-fg': fgColor,
    '--sh-acc': accColor,
    '--sh-head': headingFont,
    '--sh-accent': accentFont,
    '--sh-body': bodyFont,
    '--sh-h': height,
  }

  const activeHint = isTouchDevice ? hintTouch : hint

  return (
    <section
      ref={rootRef}
      className={`sh-root${className ? ' ' + className : ''}`}
      style={{ ...rootStyleVars, ...style } as React.CSSProperties}
    >
      <style>{heroCSS}</style>

      {backdropText && (
        <div ref={backdropRef} className="sh-backdrop" aria-hidden="true">
          {backdropText}
        </div>
      )}

      <div ref={stageRef} className="sh-stage" aria-hidden="true">
        <img
          ref={fallbackRef}
          className="sh-fallback"
          src={activeImageSrc}
          alt=""
          crossOrigin="anonymous"
          draggable={false}
        />
      </div>

      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {imageAlt}
      </span>

      {showNav && (
        <nav ref={navRef} className="sh-nav" aria-label="Primary">
          <a className="sh-brand" href="#">
            {brand}
          </a>
          <ul className="sh-links">
            {navLinks.map((link, idx) => (
              <li key={idx}>
                <a className="sh-link" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
            {themeToggle && (
              <li className="sh-keep">
                <button
                  type="button"
                  className="sh-theme"
                  aria-label={currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  onClick={() => setThemeOverride(t => ((t ?? theme) === 'dark' ? 'light' : 'dark'))}
                >
                  {currentTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
              </li>
            )}
            {navCta && navCta.label && (
              <li className="sh-keep">
                {navCta.onClick ? (
                  <button type="button" className="sh-navcta" onClick={navCta.onClick}>
                    {navCta.label}
                  </button>
                ) : (
                  <a className="sh-navcta" href={navCta.href || '#'}>
                    {navCta.label}
                  </a>
                )}
              </li>
            )}
          </ul>
        </nav>
      )}

      {interactive && activeHint && (
        <div ref={hintRef} className="sh-hint" aria-hidden="true">
          {activeHint}
        </div>
      )}

      <div className="sh-spacer" />

      <div ref={contentRef} className="sh-content">
        <div>
          {eyebrow && <p className="sh-eyebrow">{eyebrow}</p>}
          <h1 className="sh-h1">{renderHeadline(headline, headlineAccent)}</h1>
        </div>

        <div className="sh-aside">
          {body && <p className="sh-body">{body}</p>}
          <div className="sh-ctas">
            {primaryCta && primaryCta.label && (
              primaryCta.onClick ? (
                <button type="button" className="sh-btn" onClick={primaryCta.onClick}>
                  <span>{primaryCta.label}</span>
                  <ArrowIcon />
                </button>
              ) : (
                <a className="sh-btn" href={primaryCta.href || '#'}>
                  <span>{primaryCta.label}</span>
                  <ArrowIcon />
                </a>
              )
            )}
            {secondaryCta && secondaryCta.label && (
              secondaryCta.onClick ? (
                <button type="button" className="sh-txt" onClick={secondaryCta.onClick}>
                  <span>{secondaryCta.label}</span>
                  <ArrowIcon />
                </button>
              ) : (
                <a className="sh-txt" href={secondaryCta.href || '#'}>
                  <span>{secondaryCta.label}</span>
                  <ArrowIcon />
                </a>
              )
            )}
          </div>
        </div>
      </div>

      {children}

      {showCredit && (
        <a className="sh-credit" href="https://guglielmogiannattasio.it" target="_blank" rel="noopener noreferrer">
          by guglielmogiannattasio.it
        </a>
      )}
    </section>
  )
}

export default LiquidSculptureHero
