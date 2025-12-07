import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useInteraction } from '../context/InteractionContext';
import { useLanguage } from '../context/LanguageContext';
import { HandGesture } from '../types';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

// Declare global types for MediaPipe loaded via CDN
declare global {
  interface Window {
    Hands: any;
    HAND_CONNECTIONS: any;
  }
}

// --- 3D Virtual Hand Visualizer ---
const HandModel: React.FC<{ landmarksRef: React.MutableRefObject<any[] | null>, gesture: HandGesture }> = ({ landmarksRef, gesture }) => {
    // We create a pool of meshes for joints and bones
    const jointMeshes = useRef<THREE.Mesh[]>([]);
    const boneMeshes = useRef<THREE.Mesh[]>([]);

    const handGroup = useRef<THREE.Group>(null);
    const jointsGroup = useRef<THREE.Group>(null);
    const bonesGroup = useRef<THREE.Group>(null);

    // Reuse vector objects to prevent GC thrashing
    const dummyVec = useMemo(() => new THREE.Vector3(), []);
    const startVec = useMemo(() => new THREE.Vector3(), []);
    const endVec = useMemo(() => new THREE.Vector3(), []);

    // Initial Setup of arrays
    if (jointMeshes.current.length === 0) {
        jointMeshes.current = new Array(21).fill(null).map(() => new THREE.Mesh());
    }
    if (boneMeshes.current.length === 0) {
        // MediaPipe usually has ~21 connections defined in HAND_CONNECTIONS
        boneMeshes.current = new Array(21).fill(null).map(() => new THREE.Mesh());
    }

    // Material logic based on gesture
    const getMaterialColor = () => {
        switch (gesture) {
            case HandGesture.OPEN_PALM: return '#60a5fa'; // Blue
            case HandGesture.CLOSED_FIST: return '#fb7185'; // Red
            case HandGesture.POINTING: return '#22d3ee'; // Cyan
            case HandGesture.VICTORY: return '#a855f7'; // Purple
            case HandGesture.THUMBS_UP: return '#fbbf24'; // Gold
            case HandGesture.PINCH: return '#10b981'; // Emerald
            case HandGesture.ROCK: return '#ffd700'; // Gold/Amber
            case HandGesture.LOVE: return '#ec4899'; // Pink
            case HandGesture.SHAKA: return '#2dd4bf'; // Teal
            case HandGesture.OK_SIGN: return '#6366f1'; // Indigo
            case HandGesture.PINKY: return '#e2e8f0'; // Silver
            case HandGesture.VULCAN: return '#a3e635'; // Lime
            case HandGesture.SPIDERMAN: return '#ef4444'; // Red
            case HandGesture.CROSS: return '#94a3b8'; // Slate
            case HandGesture.GUN: return '#7c3aed'; // Violet
            case HandGesture.CLAW: return '#a5f3fc'; // Light Cyan
            case HandGesture.SWORD: return '#cbd5e1'; // Silver
            default: return '#94a3b8'; // Slate
        }
    };
    
    const color = getMaterialColor();

    // Custom Holographic Shader Material
    const holoMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(color) }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            // Fresnel effect for rim lighting
            float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);
            // Scanline effect
            float scan = sin(gl_FragCoord.y * 0.15 - uTime * 3.0) * 0.15 + 0.85;
            // Pulse
            float pulse = 0.8 + 0.2 * sin(uTime * 2.0);
            
            vec3 glow = uColor * (0.3 + fresnel * 2.5) * scan * pulse;
            float alpha = (0.2 + fresnel * 0.8) * scan;
            
            gl_FragColor = vec4(glow, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    }), []);

    useFrame((state) => {
        // Null checks to prevent crashes if component unmounts or refs are cleared
        if (!handGroup.current || !jointsGroup.current || !bonesGroup.current) return;
        
        const landmarks = landmarksRef.current;
        if (!landmarks || landmarks.length === 0) {
            handGroup.current.visible = false;
            return;
        }
        
        handGroup.current.visible = true;
        const time = state.clock.elapsedTime;

        // Update Shader Uniforms
        holoMaterial.uniforms.uTime.value = time;
        holoMaterial.uniforms.uColor.value.set(color);

        // Update Joints
        jointMeshes.current.forEach((mesh, i) => {
            if (!mesh) return;
            const lm = landmarks[i];
            if (lm) {
                // (lm.x - 0.5) * -4, (lm.y - 0.5) * -3, lm.z * -0.1
                mesh.position.set(
                    (lm.x - 0.5) * -4,
                    (lm.y - 0.5) * -3,
                    lm.z * -0.1
                );
                
                mesh.rotation.y += 0.02; 
                mesh.rotation.x = Math.sin(time + i) * 0.1;
                
                // Pulse size based on gesture
                const scale = 1.0 + Math.sin(time * 3) * 0.05;
                mesh.scale.setScalar(scale);
            }
        });

        // Update Bones
        if (window.HAND_CONNECTIONS) {
             window.HAND_CONNECTIONS.forEach((pair: number[], i: number) => {
                 const mesh = boneMeshes.current[i];
                 const startNode = jointMeshes.current[pair[0]];
                 const endNode = jointMeshes.current[pair[1]];
                 
                 if (mesh && startNode && endNode) {
                     startVec.copy(startNode.position);
                     endVec.copy(endNode.position);

                     // Position at midpoint
                     dummyVec.copy(startVec).add(endVec).multiplyScalar(0.5);
                     mesh.position.copy(dummyVec);
                     
                     // Orient to look at end
                     mesh.lookAt(endVec);
                     
                     // Scale length
                     const dist = startVec.distanceTo(endVec);
                     mesh.scale.set(1, 1, dist); 
                     
                     mesh.visible = true;
                 }
             });
        }
    });

    const boneGeometry = useMemo(() => {
        const geo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
        geo.rotateX(Math.PI / 2); // Rotate to align with Z axis
        return geo;
    }, []);

    return (
        <group ref={handGroup}>
            <group ref={jointsGroup}>
                {jointMeshes.current.map((_, i) => (
                    <mesh 
                        key={`j-${i}`} 
                        ref={el => { if (el) jointMeshes.current[i] = el }} 
                        material={holoMaterial}
                    >
                        <octahedronGeometry args={[0.07, 0]} /> 
                    </mesh>
                ))}
            </group>
            <group ref={bonesGroup}>
                {boneMeshes.current.map((_, i) => (
                    <mesh 
                        key={`b-${i}`} 
                        ref={el => { if(el) boneMeshes.current[i] = el }} 
                        material={holoMaterial}
                        geometry={boneGeometry}
                        visible={false}
                    />
                ))}
            </group>
            
            {/* Holographic light at wrist position */}
            <pointLight position={[0,0,1]} intensity={2.0} color={color} distance={4} decay={2} />
        </group>
    );
}

const BackgroundScanlines = () => {
    const geometry = useMemo(() => {
        const points = [];
        const range = 10;
        const step = 1;
        for (let i = -range; i <= range; i += step) {
            // Horizontal lines only (Parallel)
            points.push(-range, i, -2); // Start
            points.push(range, i, -2);  // End
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        return geo;
    }, []);

    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial color="#334155" opacity={0.3} transparent />
        </lineSegments>
    );
};

const HandVisualizer3D: React.FC<{ landmarksRef: React.MutableRefObject<any[] | null>, gesture: HandGesture }> = ({ landmarksRef, gesture }) => {
    return (
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}> {/* Optimize Pixel Ratio */}
            <color attach="background" args={['#050a14']} />
            <ambientLight intensity={0.5} />
            <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={1} color="#ffffff" />
            <pointLight position={[-5, -5, 5]} intensity={0.5} color="#4f46e5" />
            
            <BackgroundScanlines />

            <HandModel landmarksRef={landmarksRef} gesture={gesture} />
            
            <Environment preset="city" />
        </Canvas>
    );
};


const HandController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { handState, setHandState, triggerCombo, triggerAura } = useInteraction();
  const { t, tGesture } = useLanguage(); // Use translation hook

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  
  // UI State for Window Management
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Video Controls State
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(0);

  // Camera & Stream Management
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<any>(null);
  const animationFrameRef = useRef<number>(0);
  const retryCount = useRef(0);

  // Robustness & Smoothing Refs
  const GESTURE_HISTORY_SIZE = 6; // Slightly larger window for stability
  const gestureHistoryRef = useRef<HandGesture[]>([]); 
  const positionBufferRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  
  // Sequence Detection Ref
  const lastOpenPalmTimeRef = useRef<number>(0);

  const lastStateRef = useRef(handState); 
  
  // Live Landmarks Ref for 3D Visualizer
  const liveLandmarksRef = useRef<any[] | null>(null);

  // Combo UI State
  const [showCombo, setShowCombo] = useState(false);
  const [showAura, setShowAura] = useState(false);

  // Config Constants
  const UPDATE_THRESHOLD = 0.002; // Tightened threshold

  // Sensitivity Control
  const sensitivityRef = useRef(1.0);
  const [sensitivity, setSensitivity] = useState(1.0);

  // --- Sequence Detection ---
  useEffect(() => {
    const current = handState.gesture;
    
    if (handState.detected) {
        const now = Date.now();

        // 1. Record time if OPEN_PALM
        if (current === HandGesture.OPEN_PALM) {
            lastOpenPalmTimeRef.current = now;
        }

        // 2. Check Sequence: OPEN_PALM (within 1s) -> CLOSED_FIST (Summon)
        if (current === HandGesture.CLOSED_FIST) {
            // Check if OPEN_PALM was active recently (within 1s)
            // Removed > 100 check to allow faster transitions
            if (now - lastOpenPalmTimeRef.current < 1000 && lastOpenPalmTimeRef.current > 0) {
                // Ensure trigger only once per sequence
                lastOpenPalmTimeRef.current = 0; 
                triggerCombo();
                setShowCombo(true);
                setTimeout(() => setShowCombo(false), 1500);
            }
        }

        // 3. Check Sequence: OPEN_PALM (within 1s) -> POINTING (Aura)
        if (current === HandGesture.POINTING) {
             if (now - lastOpenPalmTimeRef.current < 1000 && lastOpenPalmTimeRef.current > 0) {
                lastOpenPalmTimeRef.current = 0;
                triggerAura();
                setShowAura(true);
                setTimeout(() => setShowAura(false), 1500);
            }
        }
    }
  }, [handState.gesture, handState.detected, triggerCombo, triggerAura]);


  // --- Drag & Drop Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.tagName === 'INPUT' || target.tagName === 'SELECT') return;
    
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    setPosition({ x: window.innerWidth - 340, y: 20 });
  }, []);

  // Video Control Handlers
  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
  };

  // Hand Processing Callback
  const onResults = useCallback((results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const wrist = landmarks[0];
      
      liveLandmarksRef.current = landmarks;

      const rawX = landmarks[9].x; 
      const rawY = landmarks[9].y;

      // --- ADAPTIVE SMOOTHING ALGORITHM ---
      // Calculate distance from previous smooth position
      const prevX = positionBufferRef.current.x;
      const prevY = positionBufferRef.current.y;
      const deltaSq = (rawX - prevX) ** 2 + (rawY - prevY) ** 2;
      const dist = Math.sqrt(deltaSq);

      let smoothingFactor = 0.2; // Default
      
      // Deadzone: If movement is microscopic, don't move at all to stop jitter
      if (dist < 0.002) {
          smoothingFactor = 0.0;
      } else if (dist > 0.1) {
          // Fast movement: reduce smoothing for responsiveness
          smoothingFactor = 0.7;
      }

      const smoothX = prevX + (rawX - prevX) * smoothingFactor;
      const smoothY = prevY + (rawY - prevY) * smoothingFactor;
      
      positionBufferRef.current = { x: smoothX, y: smoothY };

      const distFn = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const threshold = sensitivityRef.current;
      
      // Basic Finger Extension Check
      const isExtended = (tipIdx: number, pipIdx: number) => {
        return distFn(landmarks[tipIdx], wrist) > distFn(landmarks[pipIdx], wrist) * threshold;
      };

      // Advanced Thumb Check (Check if tip is away from palm center/Pinky base)
      const isThumbExtended = () => {
          // Distance from Thumb Tip (4) to Pinky MCP (17) should be large if open
          const d1 = distFn(landmarks[4], landmarks[17]);
          const d2 = distFn(landmarks[4], landmarks[2]); // Thumb Tip to Thumb MCP
          return d1 > 0.15 && d2 > 0.05 * threshold;
      };

      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      
      const thumbExtended = isThumbExtended();
      const indexExtended = isExtended(8, 6);
      const middleExtended = isExtended(12, 10);
      const ringExtended = isExtended(16, 14);
      const pinkyExtended = isExtended(20, 18);

      const pinchDistance = distFn(thumbTip, indexTip);
      const isPinch = pinchDistance < 0.06 * threshold; // Slightly tighter to avoid false positives

      const mainFingersExtendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

      let detectedGesture = HandGesture.NONE;

      // Priority Logic
      if (isPinch && middleExtended && ringExtended && pinkyExtended) {
          // OK Sign: Index+Thumb pinch, 3 others extended
          detectedGesture = HandGesture.OK_SIGN;
      } else if (isPinch) {
          detectedGesture = HandGesture.PINCH;
      } else if (mainFingersExtendedCount === 0) {
          if (!thumbExtended) {
            detectedGesture = HandGesture.CLOSED_FIST;
          } else {
            detectedGesture = HandGesture.THUMBS_UP;
          }
      } else if (mainFingersExtendedCount >= 4 && thumbExtended) {
          detectedGesture = HandGesture.OPEN_PALM;
      } else if (indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
          if (thumbExtended) {
             detectedGesture = HandGesture.LOVE;
          } else {
             detectedGesture = HandGesture.ROCK;
          }
      } else if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
        detectedGesture = HandGesture.SHAKA;
      } else if (!thumbExtended && !indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
        detectedGesture = HandGesture.PINKY;
      } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
        // SWORD vs VICTORY Check
        // Victory: Fingers spread. Sword: Fingers together.
        const tipDist = distFn(landmarks[8], landmarks[12]);
        if (tipDist < 0.06) {
             detectedGesture = HandGesture.SWORD;
        } else {
             detectedGesture = HandGesture.VICTORY;
        }
      } else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        // STRICT POINTING CHECK:
        // Ensure other finger tips are actually close to wrist (curled)
        const middleDist = distFn(landmarks[12], wrist);
        //const ringDist = distFn(landmarks[16], wrist);
        const middleCurled = middleDist < distFn(landmarks[11], wrist) * 1.1; // Tip closer than or near DIP
        
        if (middleCurled) {
             detectedGesture = HandGesture.POINTING;
        } else {
             // If index is up but middle isn't properly curled, detection is ambiguous.
             // Default to NONE to avoid false positives during transitions.
             detectedGesture = HandGesture.NONE;
        }
      } else if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        detectedGesture = HandGesture.THUMBS_UP;
      } else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
         // Fallback pointing if strict check fails but index is clearly only one up
         // Only if thumb is IN
         if (!thumbExtended) detectedGesture = HandGesture.POINTING;
      } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
          // Cross? (Distance check needed for crossing)
          const distIdxMid = distFn(indexTip, landmarks[12]);
          if (distIdxMid < 0.05) detectedGesture = HandGesture.CROSS;
      } else if (thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
          detectedGesture = HandGesture.GUN;
      } else if (mainFingersExtendedCount > 0 && mainFingersExtendedCount < 4) {
          // Check for CLAW (Fingers bent but not closed)
          // Simplified: if fingers are extended but tips are closer to each other?
          // Let's assume CLAW is hard to detect with simple heuristics, use explicit check
          const tips = [indexTip, landmarks[12], landmarks[16], landmarks[20]];
          // Average tip distance from wrist
          const avgDist = tips.reduce((acc, t) => acc + distFn(t, wrist), 0) / 4;
          if (avgDist > 0.3 && avgDist < 0.6) { // Half curled
             detectedGesture = HandGesture.CLAW;
          }
      } else if (indexExtended && middleExtended && !ringExtended && pinkyExtended && !thumbExtended) {
          detectedGesture = HandGesture.SPIDERMAN;
      } else if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
          // Vulcan? Separation check
          const midRingDist = distFn(landmarks[12], landmarks[16]);
          if (midRingDist > 0.1) detectedGesture = HandGesture.VULCAN;
      }


      // --- REFINED SMOOTHING: Weighted Voting Buffer ---
      gestureHistoryRef.current.push(detectedGesture);
      if (gestureHistoryRef.current.length > GESTURE_HISTORY_SIZE) {
        gestureHistoryRef.current.shift();
      }

      // Calculate weighted scores
      // More recent frames get higher score
      const scores: Record<string, number> = {};
      let maxScore = 0;
      let winner = HandGesture.NONE;
      
      gestureHistoryRef.current.forEach((g, idx) => {
          const weight = idx + 1; // 1, 2, 3... N
          scores[g] = (scores[g] || 0) + weight;
          
          if (scores[g] > maxScore) {
              maxScore = scores[g];
              winner = g as HandGesture;
          }
      });
      
      // Calculate max possible score for N items: N*(N+1)/2
      const maxPossibleScore = (GESTURE_HISTORY_SIZE * (GESTURE_HISTORY_SIZE + 1)) / 2;
      const confidenceThreshold = maxPossibleScore * 0.55; // Require > 55% of weighted score

      let finalGesture = lastStateRef.current.gesture;
      
      if (maxScore > confidenceThreshold) {
          finalGesture = winner;
      }

      const newState = {
        detected: true,
        x: 1 - smoothX, // Mirror X
        y: smoothY,
        gesture: finalGesture
      };

      const prev = lastStateRef.current;
      const posChanged = Math.abs(newState.x - prev.x) > UPDATE_THRESHOLD || Math.abs(newState.y - prev.y) > UPDATE_THRESHOLD;
      const gestureChanged = newState.gesture !== prev.gesture;
      const statusChanged = newState.detected !== prev.detected;

      if (posChanged || gestureChanged || statusChanged) {
          lastStateRef.current = newState;
          setHandState(newState);
      }

    } else {
      gestureHistoryRef.current = []; 
      liveLandmarksRef.current = null;
      
      const newState = {
        detected: false,
        x: 0.5,
        y: 0.5,
        gesture: HandGesture.NONE
      };
      
      if (lastStateRef.current.detected) {
          lastStateRef.current = newState;
          setHandState(newState);
      }
    }
  }, [setHandState]);

  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    setIsLoadingCamera(true);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const targetDeviceId = deviceId || activeDeviceId;
    
    try {
      let stream: MediaStream;
      
      try {
        const constraints: MediaStreamConstraints = {
            video: targetDeviceId ? {
                deviceId: { exact: targetDeviceId },
                width: { ideal: 640 },
                height: { ideal: 480 }
            } : {
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        retryCount.current = 0; // Reset retry on success
      } catch (err: any) {
        const errorName = err.name || 'UnknownError';
        const errorMsg = err.message || '';
        
        // Don't fallback on permission errors, they need user intervention
        const isPermissionError = 
            errorName === 'NotAllowedError' || 
            errorName === 'PermissionDeniedError' || 
            errorName === 'SecurityError' ||
            errorMsg.toLowerCase().includes('permission denied') ||
            errorMsg.toLowerCase().includes('permission dismissed');

        if (!isPermissionError && targetDeviceId && (errorName === 'OverconstrainedError' || errorName === 'NotFoundError')) {
             // Prevent infinite recursion if generic request also fails differently
             if (retryCount.current < 2) {
                 console.warn("Target camera not found, falling back to any available camera.");
                 retryCount.current++;
                 // Reset to any camera
                 stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 } }
                 });
                 // Clear the active device ID since the specific one failed
                 setActiveDeviceId('');
             } else {
                 throw err;
             }
        } else {
            throw err; 
        }
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.volume = volume;
        
        videoRef.current.onloadedmetadata = () => {
          setIsLoadingCamera(false); 
          videoRef.current?.play().catch(e => console.error("Play error", e));

          let lastTime = 0;
          const fpsInterval = 1000 / 30; // Target 30 FPS

          const processFrame = async (time: number) => {
             const elapsed = time - lastTime;
             
             if (elapsed > fpsInterval) {
                 if (videoRef.current && handsRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                     await handsRef.current.send({ image: videoRef.current });
                     lastTime = time - (elapsed % fpsInterval);
                 }
             }
             animationFrameRef.current = requestAnimationFrame(processFrame);
          };
          
          animationFrameRef.current = requestAnimationFrame(processFrame);
        };
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoInputs);

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      if (settings.deviceId && settings.deviceId !== activeDeviceId) {
        setActiveDeviceId(settings.deviceId);
      }
      
    } catch (err: any) {
      console.error("Camera Error:", err);
      let errorMessage = "Camera access unavailable.";
      
      const errorName = err.name || 'UnknownError';
      const errorMsg = err.message || (typeof err === 'string' ? err : '');

      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorName === 'SecurityError' || 
          errorMsg.toLowerCase().includes('permission denied') || errorMsg.toLowerCase().includes('permission')) {
          errorMessage = "Permission denied. Please allow camera access.";
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          errorMessage = "No camera device found.";
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          errorMessage = "Camera is in use by another application.";
      } else if (errorName === 'OverconstrainedError') {
          errorMessage = "Camera resolution not supported.";
      }
      
      setCameraError(errorMessage);
      setIsLoadingCamera(false);
    }
  }, [volume, activeDeviceId]); 

  useEffect(() => {
    const initMediaPipe = async () => {
      if (!window.Hands) {
        setTimeout(initMediaPipe, 500);
        return;
      }

      const hands = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1, 
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: any) => {
        if (onResultsRef.current) {
          onResultsRef.current(results);
        }
      });
      
      handsRef.current = hands;
      startCamera();
    };

    initMediaPipe();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (handsRef.current) handsRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    startCamera(e.target.value);
  };

  const getGestureFeedback = (gesture: HandGesture) => {
    const label = tGesture(gesture);
    switch (gesture) {
      case HandGesture.OPEN_PALM:
        return { label, color: 'text-blue-400', borderColor: 'border-blue-400', glow: 'shadow-blue-500/50', icon: '🖐' };
      case HandGesture.CLOSED_FIST:
        return { label, color: 'text-rose-400', borderColor: 'border-rose-400', glow: 'shadow-rose-500/50', icon: '✊' };
      case HandGesture.POINTING:
        return { label, color: 'text-cyan-400', borderColor: 'border-cyan-400', glow: 'shadow-cyan-500/50', icon: '☝' };
      case HandGesture.VICTORY:
        return { label, color: 'text-purple-400', borderColor: 'border-purple-400', glow: 'shadow-purple-500/50', icon: '✌' };
      case HandGesture.THUMBS_UP:
        return { label, color: 'text-yellow-400', borderColor: 'border-yellow-400', glow: 'shadow-yellow-500/50', icon: '👍' };
      case HandGesture.PINCH:
        return { label, color: 'text-emerald-400', borderColor: 'border-emerald-400', glow: 'shadow-emerald-500/50', icon: '🤏' };
       case HandGesture.ROCK:
        return { label, color: 'text-amber-400', borderColor: 'border-amber-400', glow: 'shadow-amber-500/50', icon: '🤘' };
       case HandGesture.LOVE:
        return { label, color: 'text-pink-400', borderColor: 'border-pink-400', glow: 'shadow-pink-500/50', icon: '🤟' };
       case HandGesture.SHAKA:
        return { label, color: 'text-teal-400', borderColor: 'border-teal-400', glow: 'shadow-teal-500/50', icon: '🤙' };
       case HandGesture.OK_SIGN:
        return { label, color: 'text-indigo-400', borderColor: 'border-indigo-400', glow: 'shadow-indigo-500/50', icon: '👌' };
       case HandGesture.PINKY:
        return { label, color: 'text-gray-300', borderColor: 'border-gray-300', glow: 'shadow-gray-400/50', icon: '✨' };
       case HandGesture.VULCAN:
        return { label, color: 'text-lime-400', borderColor: 'border-lime-400', glow: 'shadow-lime-500/50', icon: '🖖' };
       case HandGesture.SPIDERMAN:
        return { label, color: 'text-red-500', borderColor: 'border-red-500', glow: 'shadow-red-500/50', icon: '🕸️' };
       case HandGesture.CROSS:
        return { label, color: 'text-slate-400', borderColor: 'border-slate-400', glow: 'shadow-slate-500/50', icon: '🌀' };
       case HandGesture.GUN:
        return { label, color: 'text-violet-400', borderColor: 'border-violet-400', glow: 'shadow-violet-500/50', icon: '🌪️' };
       case HandGesture.CLAW:
        return { label, color: 'text-cyan-200', borderColor: 'border-cyan-200', glow: 'shadow-cyan-500/50', icon: '🔮' };
       case HandGesture.SWORD:
        return { label, color: 'text-slate-300', borderColor: 'border-slate-300', glow: 'shadow-slate-500/50', icon: '☯️' };
      default:
        return { label: tGesture(HandGesture.NONE), color: 'text-gray-400', borderColor: 'border-gray-600', glow: 'shadow-none', icon: '⋯' };
    }
  };

  const getFriendlyLabel = (device: MediaDeviceInfo, index: number) => {
    let label = device.label || `Camera ${index + 1}`;
    // Strip technical prefixes added by some browsers/OS
    label = label.replace(/^(Default|Communications) - /, '');
    // Strip technical USB IDs like (046d:c922) or [046d:c922] to reveal clean model names
    label = label.replace(/\s*[([][0-9a-fA-F]{4}:[0-9a-fA-F]{4}[)\]]$/, '');
    return label;
  };

  const feedback = getGestureFeedback(handState.gesture);

  return (
        <>
            <style>{`
                @keyframes pop {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
            
            {/* Combo Visual Feedback Overlays */}
            <div className={`fixed inset-0 pointer-events-none z-50 flex items-center justify-center transition-opacity duration-300 ${showCombo ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-rose-500 to-orange-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.8)] scale-150 animate-pulse">
                    SUMMON
                </div>
            </div>
             <div className={`fixed inset-0 pointer-events-none z-50 flex items-center justify-center transition-opacity duration-300 ${showAura ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)] scale-150 animate-pulse">
                    AURA
                </div>
            </div>

            {/* Draggable Control Panel */}
            <div 
                style={{ 
                    left: position.x, 
                    top: position.y,
                    transform: isCollapsed ? 'translate(calc(100% - 40px), 0)' : 'none'
                }}
                className={`fixed z-40 ${cameraError ? 'w-[22rem]' : 'w-80'} bg-[#0f172a]/90 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${isDragging ? 'cursor-grabbing' : ''}`}
            >
                {/* Header / Drag Handle */}
                <div 
                    onMouseDown={handleMouseDown}
                    className="h-10 bg-white/5 border-b border-white/5 flex items-center justify-between px-3 cursor-grab hover:bg-white/10 transition-colors select-none"
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${handState.detected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs font-bold tracking-wider text-gray-300">
                           {t('appTitle')}
                        </span>
                    </div>
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-gray-400 hover:text-white p-1"
                    >
                        {isCollapsed ? '←' : '−'}
                    </button>
                </div>

                {/* Content */}
                {!isCollapsed && (
                    <div className="p-4 space-y-4">
                        {/* Camera Preview / Visualizer */}
                        <div className={`relative ${cameraError ? 'h-80' : 'h-48'} bg-black rounded-lg overflow-hidden border border-gray-800 group transition-all duration-300`}>
                            <video 
                                ref={videoRef}
                                className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:opacity-50 transition-opacity"
                                playsInline
                                muted={volume === 0}
                            />
                             <div className="absolute inset-0">
                                <HandVisualizer3D landmarksRef={liveLandmarksRef} gesture={handState.gesture} />
                            </div>
                            
                            {/* Loading State */}
                            {isLoadingCamera && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 space-y-3">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs text-indigo-300 animate-pulse tracking-wide">{t('loading')}</p>
                                </div>
                            )}

                            {/* Camera Error */}
                            {cameraError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-30">
                                    <div className="w-12 h-12 mb-3 text-red-500 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-bold mb-2">{t('cameraError')}</h3>
                                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                        {cameraError.includes("Permission") 
                                            ? "To enable gesture control, please grant camera permissions:" 
                                            : "Unable to connect to video feed. Please try the following:"}
                                    </p>
                                    <ol className="text-[10px] text-gray-500 text-left space-y-2 mb-5 w-full bg-white/5 p-3 rounded border border-white/5">
                                        <li className="flex items-center gap-2">
                                            <span className="w-4 h-4 flex items-center justify-center bg-gray-700 rounded-full text-[8px]">1</span>
                                            Click the 🔒 or 🎥 icon in the address bar
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-4 h-4 flex items-center justify-center bg-gray-700 rounded-full text-[8px]">2</span>
                                            Set "Camera" to <strong>Allow</strong>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-4 h-4 flex items-center justify-center bg-gray-700 rounded-full text-[8px]">3</span>
                                            Refresh the page
                                        </li>
                                    </ol>
                                    <button 
                                        onClick={() => startCamera()}
                                        className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:from-red-500 hover:to-rose-500 transition-all"
                                    >
                                        {t('retry')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Gesture Status */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg border bg-black/40 ${feedback.borderColor} ${feedback.glow} transition-all duration-300`}>
                            <span 
                                key={handState.gesture} // Trigger animation on change
                                className="text-2xl animate-[pop_0.3s_ease-out]"
                            >
                                {feedback.icon}
                            </span>
                            <div>
                                <p className={`text-xs font-bold tracking-widest ${feedback.color}`}>
                                    {feedback.label}
                                </p>
                                <p className="text-[10px] text-gray-500 uppercase">
                                    {t('status')}: {handState.detected ? t('active') : t('searching')}
                                </p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-gray-500 tracking-wider">{t('inputSource')}</label>
                                <select 
                                    value={activeDeviceId}
                                    onChange={handleDeviceChange}
                                    className="w-full bg-black/40 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                                >
                                    {devices.map((device, index) => (
                                        <option key={device.deviceId} value={device.deviceId}>
                                            {getFriendlyLabel(device, index)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-[10px] uppercase text-gray-500 tracking-wider">{t('sensitivity')}</label>
                                    <span className="text-[10px] text-gray-400">{sensitivity.toFixed(1)}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="2.0" 
                                    step="0.1"
                                    value={sensitivity}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setSensitivity(val);
                                        sensitivityRef.current = val;
                                    }}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-indigo-400 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
  );
};

export default HandController;