import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import type { Difficulty } from "../../config/difficulty";
import type { GameState, ShooterSettings } from "./types";
import { soundManager } from "./soundEffects";

type ShooterArenaProps = {
  state: GameState;
  difficulty: Difficulty;
  settings: ShooterSettings;
  isPaused: boolean;
  onTargetHit: (targetId: number, remainingTargets: number) => void;
  onPrematureShot: () => void;
  onPointerLockChange: (locked: boolean) => void;
  onRecoilTriggered: () => void;
};

type ActiveTarget = {
  id: number;
  mesh: THREE.Group;
  yaw: number;
  pitch: number;
  distance: number;
  vyaw: number;
  vpitch: number;
  visible: boolean;
  blinkTimer: number;
  speedMul: number;
  scale: number;
};

type Particle = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
};

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

export default function ShooterArena({
  state,
  difficulty,
  settings,
  isPaused,
  onTargetHit,
  onPrematureShot,
  onPointerLockChange,
  onRecoilTriggered,
}: ShooterArenaProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());

  // Camera angles
  const yawRef = useRef<number>(0);
  const pitchRef = useRef<number>(0);
  const recoilOffsetRef = useRef<number>(0);

  // State refs for animation loops and event handlers
  const stateRef = useRef<GameState>(state);
  const difficultyRef = useRef<Difficulty>(difficulty);
  const settingsRef = useRef<ShooterSettings>(settings);
  const isPausedRef = useRef<boolean>(isPaused);
  const activeTargetsRef = useRef<ActiveTarget[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const isPointerLockedRef = useRef<boolean>(false);

  // Sync refs
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    settingsRef.current = settings;
    soundManager.setEnabled(settings.soundEnabled);
    soundManager.setVolume(settings.volume);
  }, [settings]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Create Bullseye 3D Target Mesh
  const createBullseyeMesh = useCallback((scale: number = 1.0): THREE.Group => {
    const group = new THREE.Group();

    // 1. Backing disc (Dark metallic armor plate)
    const backGeo = new THREE.CylinderGeometry(1.6 * scale, 1.6 * scale, 0.12, 32);
    backGeo.rotateX(Math.PI / 2);
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.3,
      metalness: 0.8,
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    group.add(backMesh);

    // 2. Outer Ring (Vibrant crimson / orange)
    const outerRingGeo = new THREE.RingGeometry(1.05 * scale, 1.5 * scale, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xff3355,
      side: THREE.DoubleSide,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.position.z = 0.07;
    group.add(outerRing);

    // 3. Middle Ring (High-vis white)
    const midRingGeo = new THREE.RingGeometry(0.55 * scale, 1.05 * scale, 32);
    const midRingMat = new THREE.MeshBasicMaterial({
      color: 0xf0f4fc,
      side: THREE.DoubleSide,
    });
    const midRing = new THREE.Mesh(midRingGeo, midRingMat);
    midRing.position.z = 0.08;
    group.add(midRing);

    // 4. Center Bullseye (Glowing neon center)
    const bullseyeGeo = new THREE.CircleGeometry(0.55 * scale, 32);
    const bullseyeMat = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      side: THREE.DoubleSide,
    });
    const bullseye = new THREE.Mesh(bullseyeGeo, bullseyeMat);
    bullseye.position.z = 0.09;
    group.add(bullseye);

    // 5. Outer glowing halo torus
    const torusGeo = new THREE.TorusGeometry(1.6 * scale, 0.06 * scale, 8, 32);
    const torusMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.z = 0.06;
    group.add(torus);

    return group;
  }, []);

  // Position target based on spherical angles (yaw, pitch, distance)
  const updateTargetTransform = useCallback((target: ActiveTarget) => {
    const { yaw, pitch, distance, mesh } = target;
    const x = distance * Math.cos(pitch) * Math.sin(yaw);
    const y = distance * Math.sin(pitch);
    const z = -distance * Math.cos(pitch) * Math.cos(yaw);

    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0); // Always face center where player stands
  }, []);

  // Spawn Target Particles on Destruction
  const spawnExplosion = useCallback((position: THREE.Vector3) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const count = 16;
    const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const colors = [0x00ff66, 0x10b981, 0x6ee7b7, 0xffffff];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const pMat = new THREE.MeshBasicMaterial({ color });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(position);

      const vel = new THREE.Vector3(
        randomBetween(-3.5, 3.5),
        randomBetween(-3.5, 3.5),
        randomBetween(-3.5, 3.5)
      );

      scene.add(pMesh);
      particlesRef.current.push({
        mesh: pMesh,
        vel,
        life: 0,
        maxLife: randomBetween(0.25, 0.55),
      });
    }
  }, []);

  // Clear all targets from scene
  const clearTargets = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    activeTargetsRef.current.forEach((t) => {
      scene.remove(t.mesh);
    });
    activeTargetsRef.current = [];
  }, []);

  // Initialize targets according to difficulty
  const spawnTargetsForRound = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    clearTargets();

    const diff = difficultyRef.current;
    const count = diff === 1 ? 1 : 3;
    const distance = 13.5;
    const targets: ActiveTarget[] = [];

    for (let i = 0; i < count; i++) {
      let yaw = 0;
      let pitch = 0;
      let vyaw = 0;
      let vpitch = 0;
      let scale = 1.0;
      let blinkTimer = Number.POSITIVE_INFINITY;

      if (diff === 1) {
        // Easy: Single target in front 120° FOV, static, larger
        yaw = randomBetween(-Math.PI * 0.33, Math.PI * 0.33);
        pitch = randomBetween(-Math.PI * 0.08, Math.PI * 0.12);
        scale = 1.35;
      } else if (diff === 2) {
        // Medium: Full 360° coverage, moving horizontally & oscillating vertically
        yaw = randomBetween(0, Math.PI * 2);
        pitch = randomBetween(-Math.PI * 0.14, Math.PI * 0.14);
        const speed = randomBetween(0.35, 0.7);
        const direction = Math.random() > 0.5 ? 1 : -1;
        vyaw = speed * direction;
        vpitch = randomBetween(-0.15, 0.15);
        scale = 1.0;
      } else {
        // Hard: Full 360° sphere, faster, cloaking/blinking, smaller
        yaw = randomBetween(0, Math.PI * 2);
        pitch = randomBetween(-Math.PI * 0.25, Math.PI * 0.25);
        const speed = randomBetween(0.7, 1.25);
        const direction = Math.random() > 0.5 ? 1 : -1;
        vyaw = speed * direction;
        vpitch = randomBetween(-0.35, 0.35);
        scale = 0.85;
        blinkTimer = randomBetween(0.4, 0.9);
      }

      const mesh = createBullseyeMesh(scale);
      mesh.name = `target_${i + 1}`;
      scene.add(mesh);

      const target: ActiveTarget = {
        id: i + 1,
        mesh,
        yaw,
        pitch,
        distance,
        vyaw,
        vpitch,
        visible: true,
        blinkTimer,
        speedMul: 1.0,
        scale,
      };

      updateTargetTransform(target);
      targets.push(target);
    }

    activeTargetsRef.current = targets;
  }, [clearTargets, createBullseyeMesh, updateTargetTransform]);

  // Handle shooting action
  const handleShoot = useCallback(() => {
    // If waiting, clicking is a premature shot penalty!
    if (stateRef.current === "waiting") {
      soundManager.playErrorSound();
      onPrematureShot();
      return;
    }

    // Only allow shooting when in 'target' state
    if (stateRef.current !== "target" || isPausedRef.current) {
      return;
    }

    // Audio gunshot
    soundManager.playGunshot();

    // Trigger visual recoil on crosshair & camera
    recoilOffsetRef.current = 0.016;
    onRecoilTriggered();

    const camera = cameraRef.current;
    if (!camera) return;

    // Raycast from exact center (0, 0) of camera view
    raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Collect all child meshes from active target groups
    const targetMeshes: THREE.Object3D[] = [];
    const meshToTargetMap = new Map<THREE.Object3D, ActiveTarget>();

    activeTargetsRef.current.forEach((target) => {
      if (target.visible) {
        target.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            targetMeshes.push(child);
            meshToTargetMap.set(child, target);
          }
        });
      }
    });

    const intersects = raycasterRef.current.intersectObjects(targetMeshes, false);

    if (intersects.length > 0) {
      // HIT!
      const hitChild = intersects[0].object;
      const hitTarget = meshToTargetMap.get(hitChild);

      if (hitTarget) {
        soundManager.playHitSound();
        spawnExplosion(hitTarget.mesh.position);

        // Remove from scene and active list
        if (sceneRef.current) {
          sceneRef.current.remove(hitTarget.mesh);
        }
        activeTargetsRef.current = activeTargetsRef.current.filter((t) => t.id !== hitTarget.id);

        const remaining = activeTargetsRef.current.length;
        onTargetHit(hitTarget.id, remaining);
        return;
      }
    }

    // Missed shot during target phase
    // Shot fired into empty space
  }, [onPrematureShot, onRecoilTriggered, onTargetHit, spawnExplosion]);

  // Build Scene, Compass Dome, and Lighting
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c08);
    scene.fog = new THREE.FogExp2(0x060c08, 0.025);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(78, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Cyber Arena Floor Grid
    const floorGrid = new THREE.GridHelper(70, 40, 0x00ff66, 0x0f2918);
    floorGrid.position.y = -5.0;
    scene.add(floorGrid);

    // Cyber Ceiling Grid
    const ceilingGrid = new THREE.GridHelper(70, 40, 0x10b981, 0x0a1c11);
    ceilingGrid.position.y = 5.0;
    scene.add(ceilingGrid);

    // Horizon Ring
    const ringGeo = new THREE.TorusGeometry(14, 0.04, 8, 96);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.35 });
    const horizonRing = new THREE.Mesh(ringGeo, ringMat);
    scene.add(horizonRing);

    // Cardinal Pylons around arena (N, E, S, W indicators)
    const pylonGeo = new THREE.CylinderGeometry(0.08, 0.08, 10, 8);
    const cardinalAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    cardinalAngles.forEach((angle, idx) => {
      const pylonMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x00ff66 : 0x10b981,
        transparent: true,
        opacity: 0.6,
      });
      const pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.set(Math.sin(angle) * 14.2, 0, -Math.cos(angle) * 14.2);
      scene.add(pylon);
    });

    // Deep space background particles
    const particleCount = 450;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = randomBetween(20, 45);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      starPos[i] = r * Math.cos(phi) * Math.sin(theta);
      starPos[i + 1] = r * Math.sin(phi);
      starPos[i + 2] = -r * Math.cos(phi) * Math.cos(theta);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x6ee7b7, size: 0.18, transparent: true, opacity: 0.65 });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00ff66, 1.5);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x059669, 1.0);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    // Animation Loop
    let lastTime = performance.now();
    const animate = (timestamp: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;

      // Update camera rotation with recoil decay
      if (cameraRef.current) {
        if (recoilOffsetRef.current > 0) {
          recoilOffsetRef.current = Math.max(0, recoilOffsetRef.current - dt * 0.12);
        }

        const effectivePitch = pitchRef.current + recoilOffsetRef.current;
        cameraRef.current.rotation.set(effectivePitch, yawRef.current, 0, "YXZ");
      }

      // Update Targets (movement and blink) when active and not paused
      if (stateRef.current === "target" && !isPausedRef.current) {
        const diff = difficultyRef.current;

        activeTargetsRef.current.forEach((t) => {
          if (diff >= 2) {
            // Orbital movement across 360°
            t.yaw += t.vyaw * t.speedMul * dt;
            t.pitch += t.vpitch * t.speedMul * dt;

            // Bounce pitch off top and bottom hemisphere limits
            const pitchLimit = diff === 3 ? Math.PI * 0.28 : Math.PI * 0.18;
            if (t.pitch > pitchLimit || t.pitch < -pitchLimit) {
              t.vpitch *= -1;
              t.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, t.pitch));
            }

            // Wrap yaw seamlessly 0..2PI
            if (t.yaw > Math.PI * 2) t.yaw -= Math.PI * 2;
            if (t.yaw < 0) t.yaw += Math.PI * 2;
          }

          if (diff === 3) {
            // Difficulty 3 cloaking / blinking
            t.blinkTimer -= dt;
            if (t.blinkTimer <= 0) {
              t.visible = !t.visible;
              t.mesh.visible = t.visible;
              t.blinkTimer = randomBetween(0.3, 0.75);
            }
          }

          updateTargetTransform(t);
        });
      }

      // Update Explosion Particles
      if (particlesRef.current.length > 0 && sceneRef.current) {
        particlesRef.current = particlesRef.current.filter((p) => {
          p.life += dt;
          p.mesh.position.addScaledVector(p.vel, dt);
          p.mesh.scale.multiplyScalar(0.96);

          if (p.life >= p.maxLife) {
            sceneRef.current?.remove(p.mesh);
            return false;
          }
          return true;
        });
      }

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (rendererRef.current && rendererRef.current.domElement) {
        mount.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [updateTargetTransform]);

  // Watch state transitions to spawn or clear targets
  useEffect(() => {
    if (state === "target") {
      spawnTargetsForRound();
    } else if (state === "idle" || state === "result" || state === "tooSoon") {
      clearTargets();
    }
  }, [clearTargets, spawnTargetsForRound, state]);

  // Pointer Lock & Mouse Movement Handler
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLockedRef.current || isPausedRef.current) return;

      const { sensitivity, invertY } = settingsRef.current;
      const factor = 0.0022 * sensitivity;

      // 360 degree continuous yaw rotation
      yawRef.current -= event.movementX * factor;

      // Vertical pitch rotation (clamped between -82° and +82°)
      const pitchDelta = event.movementY * factor * (invertY ? -1 : 1);
      pitchRef.current = Math.max(
        -Math.PI * 0.45,
        Math.min(Math.PI * 0.45, pitchRef.current - pitchDelta)
      );
    };

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === mountRef.current ||
        (mountRef.current?.contains(document.pointerLockElement) ?? false);

      isPointerLockedRef.current = isLocked;
      onPointerLockChange(isLocked);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
    };
  }, [onPointerLockChange]);

  // Mount element click to lock pointer and shoot
  const handleClick = () => {
    if (!isPointerLockedRef.current) {
      if (mountRef.current && !isPausedRef.current) {
        try {
          mountRef.current.requestPointerLock();
        } catch {
          // ignore
        }
      }
      return;
    }

    handleShoot();
  };

  return (
    <div
      ref={mountRef}
      className="arena-container"
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      role="application"
      aria-label="Arena de Tiro - Test de Reacción"
    />
  );
}
