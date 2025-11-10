import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const Avatar = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const avatarRef = useRef(null);
  const mixerRef = useRef(null);
  const animationsRef = useRef({}); // Store multiple animations
  const currentActionRef = useRef(null); // Track current playing action
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [animationLoaded, setAnimationLoaded] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');

  useEffect(() => {
    console.log('Avatar component mounted');
    
    if (!containerRef.current) {
      console.error('Container ref not available');
      return;
    }

    // Scene setup with studio background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Light grey studio background
    sceneRef.current = scene;
    console.log('Scene created with studio background');

    // Create studio room box (floor + 3 walls)
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xc0c0c0, // Darker grey for floor
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd0d0d0, // Slightly lighter grey for walls
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 600),
      wallMaterial
    );
    backWall.position.set(0, 300, -500);
    backWall.receiveShadow = true;
    backWall.castShadow = true; // Walls cast shadows on each other
    scene.add(backWall);
    
    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 600),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-500, 300, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true; // Walls cast shadows on each other
    scene.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 600),
      wallMaterial
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(500, 300, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true; // Walls cast shadows on each other
    scene.add(rightWall);
    
    console.log('Studio room box created');

    // Camera setup - default position
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      50000
    );
    camera.position.set(-7.763699823376374, 213.97766032792086, 104.43149740853539);
    console.log('Camera position:', camera.position);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    console.log('Renderer attached to DOM');

    // Setup OrbitControls for 100x scaled avatar
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(3.741352159734067, 132.31067081206825, -21.422282966573185); // Match camera view
    controls.minDistance = 10;
    controls.maxDistance = 1000;
    controls.maxPolarAngle = Math.PI / 2;
    console.log('OrbitControls enabled');

    // Keyboard controls
    const keyState = {
      w: false, a: false, s: false, d: false,
      z: false, x: false
    };

    // Function to switch animations with smooth transition
    const switchAnimation = (animName) => {
      if (!animationsRef.current[animName]) {
        console.log(`Animation ${animName} not loaded`);
        return;
      }

      const newAction = mixerRef.current.clipAction(animationsRef.current[animName]);
      
      if (currentActionRef.current && currentActionRef.current !== newAction) {
        // Smooth crossfade - longer for better blending
        currentActionRef.current.fadeOut(0.5);
        newAction.reset().fadeIn(0.5);
      }

      // Set animation speed and loop based on type - ALL at 0.5x speed
      if (animName === 'idle') {
        newAction.timeScale = 0.5;
        newAction.setLoop(THREE.LoopRepeat);
        newAction.clampWhenFinished = false;
        console.log('🎬 Idle: Looping at 0.5x speed');
        
      } else if (animName === 'jump') {
        newAction.timeScale = 0.5;
        newAction.setLoop(THREE.LoopOnce);
        newAction.clampWhenFinished = true;
        
        // Calculate duration and return to idle
        const duration = newAction.getClip().duration;
        const playTime = (duration / newAction.timeScale) * 1000;
        console.log(`🎬 Jump: Playing once (${(playTime/1000).toFixed(1)}s), then returning to idle`);
        
        // Use mixer's finished event
        const onFinished = (e) => {
          if (e.action === newAction) {
            console.log('Jump finished, returning to idle');
            mixerRef.current.removeEventListener('finished', onFinished);
            if (animationsRef.current.idle) {
              switchAnimation('idle');
            }
          }
        };
        mixerRef.current.addEventListener('finished', onFinished);
        
      } else if (animName === 'wave') {
        newAction.timeScale = 0.5;
        newAction.setLoop(THREE.LoopRepeat);
        newAction.clampWhenFinished = false;
        
        const duration = newAction.getClip().duration;
        console.log(`🎬 Wave: Looping at 0.5x speed (${(duration/newAction.timeScale).toFixed(1)}s per cycle)`);
        
      } else if (animName === 'run') {
        newAction.timeScale = 0.5;
        newAction.setLoop(THREE.LoopRepeat);
        newAction.clampWhenFinished = false;
        
        const duration = newAction.getClip().duration;
        console.log(`🎬 Run: Looping at 0.5x speed (${(duration/newAction.timeScale).toFixed(1)}s per cycle)`);
      }

      newAction.play();
      currentActionRef.current = newAction;
      setCurrentAnimation(animName);
      setAnimationLoaded(true);
    };

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key in keyState) keyState[key] = true;

      // Number keys for animations
      if (key === '1') switchAnimation('idle');
      if (key === '2') switchAnimation('jump');
      if (key === '3') switchAnimation('wave');
      if (key === '4') switchAnimation('run');
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key in keyState) keyState[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    console.log('Keyboard controls enabled: WASD to move, Z/X to zoom');

    // Lighting - Simple and bright focused on character
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Higher ambient
    scene.add(ambientLight);
    
    // Main spotlight from above-front - bright on character
    const mainLight = new THREE.SpotLight(0xffffff, 4.0); // Very bright
    mainLight.position.set(0, 400, 150); // Above and slightly in front
    mainLight.angle = Math.PI / 5;
    mainLight.penumbra = 0.2; // Soft edge
    mainLight.decay = 1.5;
    mainLight.distance = 1000;
    mainLight.target.position.set(0, 100, 0); // Aim at avatar center
    mainLight.castShadow = true;
    
    // Shadow settings - directly below character
    mainLight.shadow.camera.near = 100;
    mainLight.shadow.camera.far = 600;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    
    scene.add(mainLight);
    scene.add(mainLight.target);
    
    // Fill light from front for face/body brightness
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(0, 150, 300);
    scene.add(fillLight);

    // Subtle rim light from behind
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 200, -200);
    scene.add(rimLight);

    console.log('Simple bright lighting added');

    // Load Ready Player Me avatar
    const loader = new GLTFLoader();
    
    // Use your avatar URL here - replace with your own!
    const avatarUrl = 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb';
    
    console.log('Starting avatar load from:', avatarUrl);
    
    loader.load(
      avatarUrl,
      (gltf) => {
        console.log('Avatar loaded successfully!', gltf);
        const avatar = gltf.scene;
        avatarRef.current = avatar;
        
        // Hide avatar until idle animation loads
        avatar.visible = false;
        
        // Scale avatar 100x to match Mixamo animation scale
        avatar.position.set(0, 0, 0);
        avatar.scale.set(100, 100, 100); // 100x to match Mixamo's cm-based scale
        
        scene.add(avatar);
        
        console.log('✅ Avatar scaled 100x to match Mixamo animations (hidden until idle loads)');
        
        // Force all materials to be visible and double-sided
        avatar.traverse((child) => {
          if (child.isMesh) {
            child.visible = true;
            child.frustumCulled = false;
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
              child.material.needsUpdate = true;
            }
          }
        });

        // Setup animation mixer for animations
        const mixer = new THREE.AnimationMixer(avatar);
        mixerRef.current = mixer;

        // Get skeleton for animation retargeting
        let skeletonRoot = null;
        let boneMap = new Map();
        
        avatar.traverse((child) => {
          if (child.isSkinnedMesh) {
            console.log('Found skinned mesh:', child.name);
            console.log('Skeleton bones:', child.skeleton.bones.length);
            
            if (!skeletonRoot && child.skeleton) {
              skeletonRoot = child.skeleton;
              // Build bone map
              child.skeleton.bones.forEach(bone => {
                boneMap.set(bone.name, bone);
              });
            }
          }
          if (child.isMesh && child.morphTargetDictionary) {
            console.log('Found mesh with morph targets:', child.name);
            console.log('Available morph targets:', Object.keys(child.morphTargetDictionary));
          }
        });

        setIsLoading(false);
        console.log('Avatar added to scene');

        // Function to load and retarget animations
        const loadAnimation = (name, path) => {
          return new Promise((resolve, reject) => {
            const fbxLoader = new FBXLoader();
            console.log(`Loading ${name} animation from ${path}`);
            
            fbxLoader.load(
              path,
              (fbx) => {
                console.log(`${name} animation loaded!`);
                
                if (fbx.animations && fbx.animations.length > 0) {
                  const originalClip = fbx.animations[0];
                  console.log(`${name} has ${originalClip.tracks.length} tracks`);

                  // Retarget animation
                  const retargetedTracks = [];
                  
                  originalClip.tracks.forEach((track) => {
                    const trackParts = track.name.split('.');
                    const boneName = trackParts[0];
                    const property = trackParts[1];

                    let targetBoneName = boneName;
                    
                    if (boneName.startsWith('mixamorig')) {
                      const nameWithoutPrefix = boneName.replace('mixamorig', '');
                      if (boneMap.has(nameWithoutPrefix)) {
                        targetBoneName = nameWithoutPrefix;
                      }
                    }
                    
                    if (boneMap.has(targetBoneName)) {
                      const newTrack = track.clone();
                      newTrack.name = `${targetBoneName}.${property}`;
                      
                      // Compensate for 100x avatar scale - divide Hips position by 100
                      if (targetBoneName === 'Hips' && property === 'position') {
                        const values = newTrack.values;
                        for (let i = 0; i < values.length; i++) {
                          values[i] /= 100; // Divide by 100 to match scaled avatar
                        }
                        console.log('✓ Scaled Hips position down by 100x to match avatar scale');
                      }
                      
                      retargetedTracks.push(newTrack);
                    }
                  });

                  if (retargetedTracks.length > 0) {
                    const retargetedClip = new THREE.AnimationClip(
                      name,
                      originalClip.duration,
                      retargetedTracks
                    );
                    
                    console.log(`✓ ${name} retargeted with ${retargetedTracks.length} tracks`);
                    console.log(`  Duration: ${originalClip.duration.toFixed(2)}s (${(originalClip.duration * 30).toFixed(0)} frames @ 30fps)`);
                    resolve(retargetedClip);
                  } else {
                    reject(new Error(`No tracks could be retargeted for ${name}`));
                  }
                } else {
                  reject(new Error(`No animations found in ${name}`));
                }
              },
              (progress) => {
                console.log(`${name} loading:`, (progress.loaded / progress.total * 100).toFixed(0) + '%');
              },
              (error) => {
                console.log(`Failed to load ${name}:`, error);
                reject(error);
              }
            );
          });
        };

        // Load all animations
        const animationFiles = [
          { name: 'idle', path: '/animations/Idle.fbx', key: '1' },
          { name: 'jump', path: '/animations/Jump.fbx', key: '2' },
          { name: 'wave', path: '/animations/Wave.fbx', key: '3' },
          { name: 'run', path: '/animations/Run.fbx', key: '4' }
        ];

        Promise.all(
          animationFiles.map(anim => 
            loadAnimation(anim.name, anim.path)
              .then(clip => ({ name: anim.name, clip }))
              .catch(err => {
                console.log(`${anim.name} not found - create /public${anim.path}`);
                return null;
              })
          )
        ).then(results => {
          results.forEach(result => {
            if (result) {
              animationsRef.current[result.name] = result.clip;
              console.log(`✓ ${result.name} ready`);
            }
          });

          console.log('Available animations:', Object.keys(animationsRef.current));
          console.log('Press 1-4 to trigger animations');
          
          // Auto-play idle animation on load
          console.log('Checking for idle animation...', !!animationsRef.current.idle);
          if (animationsRef.current.idle) {
            console.log('Starting idle animation...');
            const idleAction = mixer.clipAction(animationsRef.current.idle);
            idleAction.timeScale = 0.5;
            idleAction.setLoop(THREE.LoopRepeat);
            idleAction.play();
            currentActionRef.current = idleAction;
            setCurrentAnimation('idle');
            setAnimationLoaded(true);
            
            // Show avatar now that idle is playing
            if (avatarRef.current) {
              avatarRef.current.visible = true;
              console.log('✅ Avatar visible - Idle animation playing at 0.5x speed');
            }
          } else {
            console.error('❌ Idle animation not found in animationsRef!');
          }
        });
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        setLoadProgress(percent);
        console.log(`Loading avatar: ${percent.toFixed(0)}%`);
      },
      (error) => {
        console.error('Error loading avatar:', error);
        setError(`Failed to load avatar: ${error.message}`);
        setIsLoading(false);
      }
    );

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Keyboard camera controls
      const moveSpeed = 0.05;
      const zoomSpeed = 0.1;
      
      if (keyState.w) camera.position.z -= moveSpeed;
      if (keyState.s) camera.position.z += moveSpeed;
      if (keyState.a) camera.position.x -= moveSpeed;
      if (keyState.d) camera.position.x += moveSpeed;
      if (keyState.z) {
        // Zoom in
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        camera.position.addScaledVector(direction, zoomSpeed);
      }
      if (keyState.x) {
        // Zoom out
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        camera.position.addScaledVector(direction, -zoomSpeed);
      }

      // Update controls
      controls.update();

      // Update animation mixer (for Mixamo animations)
      if (mixerRef.current) {
        mixerRef.current.update(delta);
        
        // Debug: Log positions every second
        const now = Date.now();
        if (!window.lastPosLog) window.lastPosLog = 0;
        if (now - window.lastPosLog > 1000 && avatarRef.current) {
          let hipsX = null, hipsY = null, hipsZ = null;
          let leftFootX = null, leftFootY = null, leftFootZ = null;
          let rightFootX = null, rightFootY = null, rightFootZ = null;
          
          avatarRef.current.traverse((child) => {
            if (child.isBone) {
              const worldPos = new THREE.Vector3();
              child.getWorldPosition(worldPos);
              
              if (child.name === 'Hips') {
                hipsX = worldPos.x;
                hipsY = worldPos.y;
                hipsZ = worldPos.z;
              }
              if (child.name === 'LeftFoot') {
                leftFootX = worldPos.x;
                leftFootY = worldPos.y;
                leftFootZ = worldPos.z;
              }
              if (child.name === 'RightFoot') {
                rightFootX = worldPos.x;
                rightFootY = worldPos.y;
                rightFootZ = worldPos.z;
              }
            }
          });
          
          console.log('========================================');
          console.log('📹 CAMERA:');
          console.log('Position:', camera.position);
          console.log('Target:', controls.target);
          console.log('Direction:', camera.getWorldDirection(new THREE.Vector3()));
          console.log('');
          console.log('👤 AVATAR:');
          console.log('🦴 Hips - X:', hipsX?.toFixed(3), 'Y:', hipsY?.toFixed(3), 'Z:', hipsZ?.toFixed(3));
          console.log('🦶 LeftFoot - X:', leftFootX?.toFixed(3), 'Y:', leftFootY?.toFixed(3), 'Z:', leftFootZ?.toFixed(3));
          console.log('🦶 RightFoot - X:', rightFootX?.toFixed(3), 'Y:', rightFootY?.toFixed(3), 'Z:', rightFootZ?.toFixed(3));
          console.log('📍 Avatar root - X:', avatarRef.current.position.x.toFixed(3), 'Y:', avatarRef.current.position.y.toFixed(3), 'Z:', avatarRef.current.position.z.toFixed(3));
          console.log('========================================');
          
          window.lastPosLog = now;
        }
      }

      // Add subtle idle animation if no animation loaded
      if (avatarRef.current && !animationLoaded) {
        const time = clock.getElapsedTime();
        // Subtle breathing motion
        avatarRef.current.position.y = Math.sin(time * 2) * 0.01;
        
        // Very subtle head movement for life
        avatarRef.current.rotation.y = Math.sin(time * 0.5) * 0.02;
        avatarRef.current.rotation.x = Math.sin(time * 0.7) * 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();
    console.log('Animation loop started');

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      console.log('Cleaning up');
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
      renderer.dispose();
    };
  }, [animationLoaded]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Avatar;