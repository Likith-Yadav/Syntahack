import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import './AuroraUI.css';

// Aurora Effect Component
const Aurora = ({ colorStops = ["#3A29FF", "#FF94B4", "#FF3232"], amplitude = 1.0, blend = 0.5, speed = 0.5 }) => {
  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = 'transparent';

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    const program = new Program(gl, {
      vertex: `#version 300 es
        in vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      fragment: `#version 300 es
        precision highp float;
        uniform float uTime;
        uniform float uAmplitude;
        uniform vec3 uColorStops[3];
        uniform vec2 uResolution;
        uniform float uBlend;
        out vec4 fragColor;

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod(i, 289.0);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
          m = m * m;
          m = m * m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution;
          float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
          height = exp(height);
          height = (uv.y * 2.0 - height + 0.2);
          float intensity = 0.6 * height;
          float midPoint = 0.20;
          float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
          vec3 auroraColor = intensity * mix(uColorStops[0], uColorStops[1], uv.x);
          fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    let animateId = 0;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.01 * speed * 0.1;
      renderer.render({ scene: mesh });
    };
    animateId = requestAnimationFrame(update);

    const resize = () => {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };
    window.addEventListener("resize", resize);
    resize();

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [amplitude, blend, colorStops, speed]);

  return <div ref={ctnDom} className="aurora-container" />;
};

// Square Boxes Component
const SquareBoxes = ({ count = 20, size = 50, opacity = 0.1 }) => {
  const boxes = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: size * (0.5 + Math.random() * 0.5),
    delay: Math.random() * 2
  }));

  return (
    <div className="square-boxes-container">
      {boxes.map((box) => (
        <motion.div
          key={box.id}
          className="square-box"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: opacity, scale: 1 }}
          transition={{ duration: 1, delay: box.delay }}
          style={{
            position: 'absolute',
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: box.size,
            height: box.size,
            border: '1px solid rgba(139, 92, 246, 0.2)',
            background: 'rgba(139, 92, 246, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px'
          }}
        />
      ))}
    </div>
  );
};

// Main AuroraUI Component
const AuroraUI = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="aurora-ui-container">
      <Aurora />
      <SquareBoxes />
      <div className="content-container">
        {children}
      </div>
    </div>
  );
};

export default AuroraUI; 