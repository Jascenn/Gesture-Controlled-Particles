import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useInteraction } from '../context/InteractionContext';
import { HandGesture, TRIGRAMS } from '../types';
import { generateBaguaPoints } from '../utils/particleGeometry';

// --- Sound Generators ---
const audioCtxRef = { current: null as AudioContext | null };
const getAudioContext = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
};

const playGestureSound = (type: 'expand' | 'focus' | 'wind' | 'click') => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'expand') {
        osc.type = 'sine';
        const freq = [523.25, 659.25, 783.99, 1046.50][Math.floor(Math.random() * 4)];
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        osc.start();
        osc.stop(now + 2.0);
    } else if (type === 'focus') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, now);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
        gain.gain.linearRampToValueAtTime(0, now + 1.5);
        osc.start();
        osc.stop(now + 1.5);
    } else if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start();
        osc.stop(now + 0.05);
    } else if (type === 'wind') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        const lfo = ctx.createOscillator();
        lfo.type = 'triangle';
        lfo.frequency.value = 50;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 500;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.2);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start();
        osc.stop(now + 0.5);
        lfo.stop(now + 0.5);
    }
};

const AmbientSound = () => {
    const { handState } = useInteraction();
    const { detected, gesture } = handState;
    const prevGesture = useRef(HandGesture.NONE);

    useEffect(() => {
        if (!detected) return;
        if (gesture !== prevGesture.current) {
            if (gesture === HandGesture.OPEN_PALM) playGestureSound('expand');
            else if (gesture === HandGesture.CLOSED_FIST) playGestureSound('focus');
            else if (gesture === HandGesture.POINTING) playGestureSound('wind');
            else if (gesture === HandGesture.PINCH) playGestureSound('click');
        }
        prevGesture.current = gesture;
    }, [gesture, detected]);

    return null;
};

const CameraHandler = () => {
    const { handState } = useInteraction();
    const { camera, scene } = useThree();
    
    useFrame((state) => {
        const targetZ = handState.detected ? 14 : 28;
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.03);
        
        const targetFogDensity = handState.detected ? 40 : 25;
        if (scene.fog instanceof THREE.Fog) {
            scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, targetFogDensity, 0.02);
        }

        if (camera instanceof THREE.PerspectiveCamera) {
            let targetFov = 45; 
            if (handState.detected) {
                if (handState.gesture === HandGesture.CLOSED_FIST) targetFov = 38; 
                else if (handState.gesture === HandGesture.OPEN_PALM) targetFov = 52; 
            }
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.05);
            camera.updateProjectionMatrix();
        }
    });
    return null;
};

const TrailEffect = () => null;
const Shockwave = () => null;

const ComboBurst = () => {
    const { lastComboTime } = useInteraction();
    const meshRef = useRef<THREE.Mesh>(null);
    const lastTriggerRef = useRef(0);
    const startTimeRef = useRef(0);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        
        if (lastComboTime > lastTriggerRef.current) {
            lastTriggerRef.current = lastComboTime;
            startTimeRef.current = time;
            meshRef.current.visible = true;
            meshRef.current.rotation.z = Math.random() * Math.PI;
            playGestureSound('focus'); 
        }

        const elapsed = time - startTimeRef.current;
        const duration = 2.5;

        if (elapsed < duration && meshRef.current.visible) {
             const t = elapsed / duration;
             const scale = 1.0 + t * 20.0; 
             meshRef.current.scale.setScalar(scale);
             const opacity = Math.max(0, 1.0 - Math.pow(t, 2));
             const material = meshRef.current.material as THREE.MeshBasicMaterial;
             material.opacity = opacity;
        } else {
            meshRef.current.visible = false;
        }
    });

    return (
        <mesh ref={meshRef} visible={false} rotation={[0,0,0]}>
             <ringGeometry args={[0.8, 1.0, 64]} />
             <meshBasicMaterial 
                color="#fbbf24" 
                transparent 
                opacity={1.0} 
                side={THREE.DoubleSide} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
             />
        </mesh>
    );
}

const CentralStatus = () => {
    const { activeTrigramIndex } = useInteraction();
    const activeTrigram = TRIGRAMS[activeTrigramIndex % 8] || TRIGRAMS[0];

    return (
        <Html center position={[0, 0, 0]} zIndexRange={[100, 0]}>
            <div className="flex flex-col items-center justify-center opacity-80 pointer-events-none select-none transition-all duration-500">
                 <h1 
                    className="text-7xl md:text-8xl font-serif font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" 
                    style={{ textShadow: `0 0 30px ${activeTrigram.color}` }}
                 >
                    {activeTrigram.chinese}
                 </h1>
                 <p className="text-xs md:text-sm tracking-[0.4em] text-white/70 uppercase mt-2 font-sans font-light">
                    {activeTrigram.name}
                 </p>
            </div>
        </Html>
    );
};

const BaguaParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { handState, activeTrigramIndex, setActiveTrigramIndex, lastComboTime, lastAuraTime } = useInteraction();
  const { viewport } = useThree();
  
  // Use extracted geometry generator
  const { positions, colors, sizes, hammerSickleTargets, loveTargets, shakaTargets, portalTargets, starTargets, moonTargets, chaosTargets, vortexTargets, sphereTargets, merkabaTargets, gridTargets, yinYangTargets, realCount } = useMemo(() => generateBaguaPoints(7000), []);
  
  const currentPositions = useRef(positions.slice());
  const simulationRef = useRef({ density: 1.0 });

  const lastComboTimeRef = useRef(0);
  const lastAuraTimeRef = useRef(0);
  const rotationSnapRef = useRef<number | null>(null);
  const prevGestureRef = useRef(HandGesture.NONE);

  const uniforms = useMemo(() => ({
    pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 15.0 },
    uOverrideColor: { value: new THREE.Color(0, 0, 0) },
    uMixFactor: { value: 0.0 },
    uTime: { value: 0 },
    uComboTriggerTime: { value: -999.0 },
    uAuraTriggerTime: { value: -999.0 }
  }), []);

  const activeTrigram = TRIGRAMS[activeTrigramIndex % 8] || TRIGRAMS[0];

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const { detected, x, y, gesture } = handState;

    uniforms.uTime.value = time;

    // Trigger Uniform Updates
    if (lastComboTime > lastComboTimeRef.current) { lastComboTimeRef.current = lastComboTime; uniforms.uComboTriggerTime.value = time; }
    if (lastAuraTime > lastAuraTimeRef.current) { lastAuraTimeRef.current = lastAuraTime; uniforms.uAuraTriggerTime.value = time; }

    const material = pointsRef.current.material as THREE.ShaderMaterial;
    let targetMix = 0.0;
    const targetColor = new THREE.Color(0, 0, 0);

    // 1. Determine State & Color (Simplified)
    if (detected) {
      if (gesture === HandGesture.OPEN_PALM) { targetMix = 0.8; targetColor.set('#60a5fa'); }
      else if (gesture === HandGesture.CLOSED_FIST) { targetMix = 0.8; targetColor.set('#fb7185'); }
      else if (gesture === HandGesture.POINTING) { targetMix = 0.6; targetColor.set('#22d3ee'); }
      else if (gesture === HandGesture.ROCK) { targetMix = 0.9; targetColor.set('#ffd700'); }
      else if (gesture === HandGesture.LOVE) { targetMix = 0.9; targetColor.set('#ec4899'); }
      else if (gesture === HandGesture.SHAKA) { targetMix = 0.9; targetColor.set('#2dd4bf'); }
      else if (gesture === HandGesture.OK_SIGN) { targetMix = 0.9; targetColor.set('#6366f1'); } 
      else if (gesture === HandGesture.PINKY) { targetMix = 0.9; targetColor.set('#facc15'); } 
      else if (gesture === HandGesture.VICTORY) { targetMix = 0.9; targetColor.set('#cbd5e1'); } 
      else if (gesture === HandGesture.VULCAN) { targetMix = 0.9; targetColor.set('#a3e635'); }
      else if (gesture === HandGesture.SPIDERMAN) { targetMix = 0.9; targetColor.set('#ef4444'); }
      else if (gesture === HandGesture.CROSS) { targetMix = 0.5; targetColor.set('#94a3b8'); }
      else if (gesture === HandGesture.GUN) { targetMix = 0.9; targetColor.set('#7c3aed'); }
      else if (gesture === HandGesture.CLAW) { targetMix = 0.9; targetColor.set('#a5f3fc'); }
      else if (gesture === HandGesture.SWORD) { targetMix = 0.9; targetColor.set('#1a202c'); } 
    }

    material.uniforms.uMixFactor.value = THREE.MathUtils.lerp(material.uniforms.uMixFactor.value, targetMix, 0.1);
    material.uniforms.uOverrideColor.value.lerp(targetColor, 0.1);

    // 2. Rotation Logic (Pinch Cycle)
    if (detected && gesture === HandGesture.PINCH && prevGestureRef.current !== HandGesture.PINCH) {
         playGestureSound('click');
         const segment = Math.PI / 4;
         rotationSnapRef.current = pointsRef.current.rotation.z - segment; 
    }
    prevGestureRef.current = gesture;

    if (rotationSnapRef.current !== null) {
        pointsRef.current.rotation.z = THREE.MathUtils.lerp(pointsRef.current.rotation.z, rotationSnapRef.current, 0.1);
        if (Math.abs(pointsRef.current.rotation.z - rotationSnapRef.current) < 0.005) rotationSnapRef.current = null;
    } else {
        pointsRef.current.rotation.z -= 0.002; 
    }

    // 3. Tilt Logic
    let targetTiltX = 0, targetTiltY = 0;
    if (detected) { targetTiltX = (y - 0.5) * 1; targetTiltY = (x - 0.5) * 1; } 
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, targetTiltX, 0.1);
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetTiltY, 0.1);

    // 4. Update Trigram Index
    let currentRot = Math.abs(pointsRef.current.rotation.z % (Math.PI * 2));
    if (pointsRef.current.rotation.z > 0) currentRot = (Math.PI * 2) - currentRot;
    const segmentIndex = Math.floor(((currentRot + Math.PI/2 + Math.PI/8) % (Math.PI*2)) / (Math.PI/4));
    setActiveTrigramIndex(segmentIndex % 8);

    // 5. Density Logic
    let targetDensity = 1.0;
    if (detected) {
        if (gesture === HandGesture.OPEN_PALM) targetDensity = 3.5; 
        else if (gesture === HandGesture.CLOSED_FIST) targetDensity = 0.15; 
    }
    simulationRef.current.density = THREE.MathUtils.lerp(simulationRef.current.density, targetDensity, 0.08);
    const density = simulationRef.current.density;

    const positionAttribute = pointsRef.current.geometry.attributes.position;
    const pointerX = (x - 0.5) * viewport.width;
    const pointerY = -(y - 0.5) * viewport.height;
    
    // --- OPTIMIZATION: Determine Active Target Array Once ---
    let activeTargetArray: Float32Array | null = null;
    let targetMode: 'transform' | 'physics' | 'sword' = 'physics';

    if (detected) {
        switch (gesture) {
            case HandGesture.ROCK: activeTargetArray = hammerSickleTargets; targetMode = 'transform'; break;
            case HandGesture.LOVE: activeTargetArray = loveTargets; targetMode = 'transform'; break;
            case HandGesture.SHAKA: activeTargetArray = shakaTargets; targetMode = 'transform'; break;
            case HandGesture.OK_SIGN: activeTargetArray = portalTargets; targetMode = 'transform'; break;
            case HandGesture.PINKY: activeTargetArray = starTargets; targetMode = 'transform'; break;
            case HandGesture.VICTORY: activeTargetArray = moonTargets; targetMode = 'transform'; break;
            case HandGesture.VULCAN: activeTargetArray = merkabaTargets; targetMode = 'transform'; break;
            case HandGesture.SPIDERMAN: activeTargetArray = gridTargets; targetMode = 'transform'; break;
            case HandGesture.CROSS: activeTargetArray = chaosTargets; targetMode = 'transform'; break;
            case HandGesture.GUN: activeTargetArray = vortexTargets; targetMode = 'transform'; break;
            case HandGesture.CLAW: activeTargetArray = sphereTargets; targetMode = 'transform'; break;
            case HandGesture.SWORD: activeTargetArray = yinYangTargets; targetMode = 'sword'; break;
        }
    }

    const element = activeTrigram.element;

    // --- Particle Loop ---
    for (let i = 0; i < realCount; i++) {
        const idx = i * 3;
        const ox = positions[idx];
        const oy = positions[idx + 1];
        const oz = positions[idx + 2];
        
        let tx = ox * density;
        let ty = oy * density;
        let tz = oz;

        if (targetMode === 'transform' && activeTargetArray) {
             // Standard Shape Morphing
             tx = activeTargetArray[idx];
             ty = activeTargetArray[idx+1];
             tz = activeTargetArray[idx+2];
             
             // Dynamic Modifiers per shape
             if (gesture === HandGesture.ROCK) { tx+=(Math.random()-0.5)*0.05; ty+=(Math.random()-0.5)*0.05; }
             else if (gesture === HandGesture.LOVE) { const beat = 1.0 + Math.sin(time*6)*0.05; tx*=beat; ty*=beat; tz*=beat; }
             else if (gesture === HandGesture.SHAKA) { const r = time; const cr=Math.cos(r); const sr=Math.sin(r); const rx=tx*cr-ty*sr; const ry=tx*sr+ty*cr; tx=rx; ty=ry; }
             else if (gesture === HandGesture.OK_SIGN) { const spin = time * 2; const cs=Math.cos(spin); const ss=Math.sin(spin); const rx=tx*cs-ty*ss; const ry=tx*ss+ty*cs; tx=rx; ty=ry; }
             else if (gesture === HandGesture.PINKY) { const roll = time * 4; const cr=Math.cos(roll); const sr=Math.sin(roll); const rx=tx*cr-tz*sr; const rz=tx*sr+tz*cr; tx=rx; tz=rz; }
             else if (gesture === HandGesture.VULCAN) { const spin = time; const cs=Math.cos(spin); const ss=Math.sin(spin); const rx=tx*cs-tz*ss; const rz=tx*ss+tz*cs; tx=rx; tz=rz; }
             else if (gesture === HandGesture.CROSS) { tx += Math.sin(time*10+idx)*0.5; }
             else if (gesture === HandGesture.GUN) { const rot = time*2 + tz*0.5; const c=Math.cos(rot); const s=Math.sin(rot); const rx=tx*c-ty*s; const ry=tx*s+ty*c; tx=rx; ty=ry; tx += (pointerX*0.5); ty += (pointerY*0.5); }
             else if (gesture === HandGesture.CLAW) { tx += (pointerX*0.2); ty += (pointerY*0.2); }

        } else if (targetMode === 'sword' && activeTargetArray) {
             // Yin Yang Logic (S-Curve & Disc)
             tx = activeTargetArray[idx];
             ty = activeTargetArray[idx+1];
             tz = activeTargetArray[idx+2];
             
             const rot = time;
             const cr = Math.cos(rot); 
             const sr = Math.sin(rot);
             const rx = tx*cr - ty*sr;
             const ry = tx*sr + ty*cr;
             tx = rx; ty = ry;

        } else {
            // Default Bagua Physics
            if (!detected) {
                // Idle Animation: Organic "Breathing" and Flow
                const t = time * 0.6; // Slow time base
                
                // 1. Respiration: Entire structure expands/contracts slowly
                const breath = 1.0 + Math.sin(t * 0.5) * 0.02;
                tx *= breath;
                ty *= breath;
                
                // 2. Drift: Gentle swaying
                tx += Math.sin(t + oy * 0.3) * 0.04;
                ty += Math.cos(t * 0.7 + ox * 0.3) * 0.04;

                // 3. Micro-movement: Individual particle jitter to prevent static look
                tx += Math.sin(time * 2.0 + idx) * 0.005;
                ty += Math.cos(time * 2.0 + idx) * 0.005;

                // 4. Vertical Flow: A subtle energy wave moving up
                const wave = Math.sin(oy * 0.5 - t * 1.5);
                tz += wave * 0.05;
            } else {
                if (element === 'Fire') {
                    ty += Math.sin(time * 10 + ox) * 0.05 + 0.02; 
                    tx += (Math.random() - 0.5) * 0.03;
                } else if (element === 'Water') {
                    tx += Math.sin(time * 3 + oy) * 0.1; 
                    ty -= 0.02; 
                } else if (element === 'Wood') {
                    tx += Math.cos(time * 20) * 0.02;
                    ty += Math.sin(time * 20) * 0.02;
                } else if (element === 'Metal') {
                    tx = Math.round(tx * 4) / 4;
                    ty = Math.round(ty * 4) / 4;
                } else if (element === 'Earth') {
                    tx *= 0.99; ty *= 0.99;
                } else if (element === 'Wind') {
                    const angle = Math.atan2(ty, tx) + 0.02;
                    const r = Math.sqrt(tx*tx + ty*ty);
                    tx = Math.cos(angle) * r;
                    ty = Math.sin(angle) * r;
                }
            }
            
            const distFromCenter = Math.sqrt(ox*ox + oy*oy);
            const breath = Math.sin(time * (density<0.5?4:0.5) + distFromCenter * 0.2) * (density<0.5?0.02:0.05*density);
            tx += ox * breath; ty += oy * breath;

            if (detected && gesture === HandGesture.POINTING) {
                const dx = tx - pointerX; const dy = ty - pointerY;
                const distSq = dx*dx + dy*dy;
                if (distSq < 36) {
                    const dist = Math.sqrt(distSq);
                    const influence = (1.0 - dist / 6.0); 
                    const swirlAngle = influence * 3.0; 
                    const relX = tx - pointerX; const relY = ty - pointerY;
                    const rotX = relX * Math.cos(swirlAngle) - relY * Math.sin(swirlAngle);
                    const rotY = relX * Math.sin(swirlAngle) + relY * Math.cos(swirlAngle);
                    tx = pointerX + rotX; ty = pointerY + rotY;
                }
            }
        }
        
        // Final position interpolation
        currentPositions.current[idx] = THREE.MathUtils.lerp(currentPositions.current[idx], tx, 0.08);
        currentPositions.current[idx+1] = THREE.MathUtils.lerp(currentPositions.current[idx+1], ty, 0.08);
        currentPositions.current[idx+2] = THREE.MathUtils.lerp(currentPositions.current[idx+2], tz, 0.08);
    }

    positionAttribute.array.set(currentPositions.current);
    positionAttribute.needsUpdate = true;
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={realCount} array={currentPositions.current} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          transparent
          depthWrite={false}
          vertexColors
          uniforms={uniforms}
          vertexShader={`
              uniform float pixelRatio;
              uniform float uSize;
              uniform vec3 uOverrideColor;
              uniform float uMixFactor;
              uniform float uTime;
              uniform float uComboTriggerTime;
              uniform float uAuraTriggerTime;
              attribute float size;
              varying vec3 vColor;
              void main() {
                  vec3 finalColor = color;
                  vec3 newPosition = position;
                  float sizeMultiplier = 1.0;
                  
                  // Aura Shimmer
                  if (uTime - uAuraTriggerTime > 0.0 && uTime - uAuraTriggerTime < 2.0) {
                      float auraProgress = (uTime - uAuraTriggerTime) / 2.0; 
                      float auraFade = sin(auraProgress * 3.14159);
                      
                      float shimmer = sin(uTime * 50.0 + newPosition.y * 10.0 + newPosition.x * 10.0) * 0.5 + 0.5;
                      vec3 auraColor = vec3(0.4, 0.9, 1.0); 
                      
                      newPosition += normalize(newPosition) * (shimmer * 0.15 * auraFade);
                      finalColor = mix(finalColor, auraColor, auraFade * 0.6);
                      sizeMultiplier *= (1.0 + shimmer * 0.8 * auraFade);
                  }

                  // Combo Ripple
                  float waveSpeed = 8.0;
                  float waveRadius = (uTime - uComboTriggerTime) * waveSpeed;
                  float dist = length(newPosition.xy);
                  float waveWidth = 3.0;
                  if (uTime - uComboTriggerTime > 0.0 && uTime - uComboTriggerTime < 3.0) {
                      float diff = abs(dist - waveRadius);
                      if (diff < waveWidth) {
                          float intensity = 1.0 - (diff / waveWidth);
                          intensity = pow(intensity, 2.0); 
                          vec3 gold = vec3(1.0, 0.9, 0.4);
                          finalColor = mix(finalColor, gold, intensity * 0.9);
                          newPosition.z += intensity * 1.0;
                          sizeMultiplier *= (1.0 + intensity * 1.5);
                      }
                  }
                  
                  finalColor = mix(finalColor, uOverrideColor, uMixFactor);
                  vColor = finalColor;
                  vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
                  gl_Position = projectionMatrix * mvPosition;
                  gl_PointSize = size * uSize * pixelRatio * (30.0 / -mvPosition.z) * sizeMultiplier;
              }
          `}
          fragmentShader={`
              varying vec3 vColor;
              void main() {
                  vec2 center = gl_PointCoord - 0.5;
                  if (length(center) > 0.5) discard;
                  gl_FragColor = vec4(vColor, 0.8);
              }
          `}
        />
      </points>
    </group>
  );
};

const Scene = () => {
    return (
        <Canvas camera={{ position: [0, 0, 18], fov: 45 }}>
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 10, 40]} />
            <ambientLight intensity={0.5} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <CameraHandler />
            <AmbientSound />
            <CentralStatus />
            <BaguaParticles />
            <TrailEffect />
            <Shockwave />
            <ComboBurst />
            <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} />
        </Canvas>
    );
};

export default Scene;