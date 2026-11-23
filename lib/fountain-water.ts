export type FountainWaterSettings = {
  /** Position directly underneath the pedestal, in top-left image UV coordinates. */
  rippleOrigin: readonly [number, number];
  waveSpeed: number;
  waveFrequency: number;
  waveAmplitude: number;
  waveDecay: number;
  reflectionIntensity: number;
  surfaceDistortion: number;
};

export const fountainWaterSettings: FountainWaterSettings = {
  rippleOrigin: [.497, .6815],
  waveSpeed: .046,
  waveFrequency: 11.5,
  waveAmplitude: .72,
  waveDecay: 3.25,
  reflectionIntensity: .14,
  surfaceDistortion: .0065,
};

export const fountainWaterCrop = { left: .065, top: .642, width: .86, height: .059 };

const vertexShader = `
  attribute vec2 aPosition;
  varying vec2 vPosition;

  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = vec2(aPosition.x + 1.0, 1.0 - aPosition.y) * 0.5;
  }
`;

const fragmentShader = `
  precision highp float;
  uniform sampler2D uArtwork;
  uniform vec4 uCrop;
  uniform vec2 uOrigin;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uFrequency;
  uniform float uAmplitude;
  uniform float uDecay;
  uniform float uReflection;
  uniform float uDistortion;
  varying vec2 vPosition;

  const float TAU = 6.28318530718;

  float roundedBox(vec2 uv, vec2 center, vec2 halfSize, float radius) {
    vec2 q = abs(uv - center) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  float waterMask(vec2 uv) {
    // The inner rim is an ellipse in the photograph. It foreshortens the water plane.
    vec2 basin = (uv - vec2(0.493, 0.672)) / vec2(0.416, 0.0234);
    float rim = 1.0 - smoothstep(0.86, 0.99, length(basin));
    // Separate holdouts for the glass and the low stone pedestal it sits on.
    float glass = roundedBox(uv, vec2(0.496, 0.629), vec2(0.051, 0.047), 0.0025);
    float pedestal = roundedBox(uv, vec2(0.497, 0.6766), vec2(0.084, 0.0130), 0.0045);
    return rim * smoothstep(0.001, 0.0035, min(glass, pedestal));
  }

  void main() {
    vec2 uv = uCrop.xy + vPosition * uCrop.zw;
    float mask = waterMask(uv);
    if (mask < 0.001) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec2 projected = (uv - uOrigin) / vec2(1.0, 0.105);
    float distanceFromSource = length(projected);
    vec2 radial = projected / max(0.001, distanceFromSource);
    float travel = uTime * uSpeed;
    float spacing = 0.28 * sin(13.0 * distanceFromSource - 0.42 * uTime);
    float phase = TAU * uFrequency * (distanceFromSource - travel) + spacing;
    float interference = TAU * uFrequency * 1.42 * (distanceFromSource - travel * 0.79)
      + 0.42 * sin(0.37 * uTime + 8.0 * distanceFromSource);
    float modulation = 0.87 + 0.13 * sin(0.91 * uTime - 17.0 * distanceFromSource);
    float envelope = uAmplitude * modulation * smoothstep(0.012, 0.085, distanceFromSource)
      * exp(-uDecay * distanceFromSource) * mask;

    // The height-field slope bends the original texture. Its curvature also
    // focuses existing warm highlights where the water changes direction.
    float slope = (0.77 * cos(phase) + 0.23 * cos(interference)) * envelope;
    float curvature = (0.72 * sin(phase) + 0.28 * sin(interference)) * envelope;
    vec2 refractedUv = uv + radial * vec2(1.0, 0.40) * slope * uDistortion;
    refractedUv = mix(uv, refractedUv, smoothstep(0.1, 0.85, waterMask(refractedUv)));
    vec3 reflected = texture2D(uArtwork, refractedUv).rgb;
    float existingLight = smoothstep(0.25, 0.84, dot(reflected, vec3(0.299, 0.587, 0.114)));
    float shimmer = (slope * 0.35 + curvature * 0.65) * uReflection * existingLight;
    gl_FragColor = vec4(reflected * (1.0 + shimmer), mask);
  }
`;

function compile(gl: WebGLRenderingContext, kind: number, source: string) {
  const shader = gl.createShader(kind);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createFountainWater(
  gl: WebGLRenderingContext,
  settings: FountainWaterSettings,
) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const dispose = () => {
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };

  if (program && vertex && fragment) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!program || !buffer || !texture || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose();
    return null;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, "uArtwork"), 0);

  const { left, top, width, height } = fountainWaterCrop;
  gl.uniform4f(gl.getUniformLocation(program, "uCrop"), left, top, width, height);
  gl.uniform2f(gl.getUniformLocation(program, "uOrigin"), ...settings.rippleOrigin);
  const uniformValues = {
    uSpeed: settings.waveSpeed,
    uFrequency: settings.waveFrequency,
    uAmplitude: settings.waveAmplitude,
    uDecay: settings.waveDecay,
    uReflection: settings.reflectionIntensity,
    uDistortion: settings.surfaceDistortion,
  };
  for (const [name, value] of Object.entries(uniformValues)) {
    gl.uniform1f(gl.getUniformLocation(program, name), value);
  }
  const time = gl.getUniformLocation(program, "uTime");

  return {
    dispose,
    upload(artwork: HTMLImageElement) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, artwork);
      return gl.getError() === gl.NO_ERROR;
    },
    draw(elapsedSeconds: number) {
      gl.uniform1f(time, elapsedSeconds);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
