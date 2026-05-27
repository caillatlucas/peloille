/// <reference types="@react-three/fiber" />
'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Define custom R3F elements
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const DirectionalLight = 'directionalLight' as any;
const ScenePrimitive = 'primitive' as any;

function assignCylindricalUVs(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (!bbox) return;

  const min = bbox.min;
  const max = bbox.max;
  const rangeY = (max.y - min.y) || 1;

  // Calculate the physical center of the mesh to center the cylinder wrapping axis!
  const centerX = (min.x + max.x) / 2;
  const centerZ = (min.z + max.z) / 2;

  const positions = geometry.attributes.position;
  const count = positions.count;
  const uvs = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Project coordinates relative to the mesh's physical center
    const dx = x - centerX;
    const dz = z - centerZ;

    const u = 0.5 + Math.atan2(dz, dx) / (2 * Math.PI);
    const v = (y - min.y) / rangeY;

    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  if (geometry.index) {
    geometry.computeVertexNormals();
  }
}

function Statue({ color, textureUrl, modelUrl, useOriginalMaterial }: { color: string; textureUrl?: string; modelUrl?: string; useOriginalMaterial?: boolean }) {
  const mesh = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelUrl || 'models/model.glb');
  
  // Clone the scene so that we do not modify the globally cached Drei scene,
  // allowing seamless toggling of original materials.
  const clonedScene = useMemo(() => {
    return scene.clone();
  }, [scene]);
  
  // Detect if color is white (top of page) to trigger the red shadow effect
  const isWhite = color.toLowerCase() === '#ffffff' || color.toLowerCase() === 'white';

  // React state to store the loaded texture
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Load the texture when textureUrl changes
  useEffect(() => {
    if (!textureUrl) {
      setTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    
    loader.load(
      textureUrl,
      (tex) => {
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(1, 1);
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.error("Error loading texture in Three.js:", err);
      }
    );
  }, [textureUrl]);

  useMemo(() => {
    if (useOriginalMaterial) {
      // Do not overwrite materials, preserve original GLB textures & shaders
      return;
    }

    // If a texture is loaded, use MeshStandardMaterial to render photorealistic marble details.
    // Otherwise, use the stylized cell-shaded MeshToonMaterial.
    const material = texture
      ? new THREE.MeshStandardMaterial({
          color: '#ffffff',
          map: texture,
          roughness: 0.7,
          metalness: 0.15,
        })
      : new THREE.MeshToonMaterial({
          color: color,
          emissive: isWhite ? '#ff0000' : color, // Red glow when white
          emissiveIntensity: isWhite ? 0.3 : 0.1,
        });

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.geometry.attributes.uv) {
          console.log("Three.js - Mesh name:", child.name, "lacks UV mapping. Generating cylindrical mapping...");
          assignCylindricalUVs(child.geometry);
        } else {
          console.log("Three.js - Mesh name:", child.name, "already has UV mapping.");
        }
        child.material = material;
      }
    });
  }, [clonedScene, color, isWhite, texture, useOriginalMaterial]);

  const currentRotationY = useRef(0);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (mesh.current) {
      const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      const targetRotation = t * 0.15 + scrollY * 0.0015;
      
      // Smooth linear interpolation (lerp) to prevent snapping/teleporting
      currentRotationY.current += (targetRotation - currentRotationY.current) * 0.05;
      
      mesh.current.rotation.y = currentRotationY.current;
      mesh.current.position.y = Math.sin(t * 0.5) * 0.1 - 1.2;
    }
  });

  return (
    <group>
      <ScenePrimitive 
        ref={mesh} 
        object={clonedScene} 
        scale={2.8} 
        position={[0, -1.2, 0]} 
      />
      {/* Dynamic Red Shadow when white */}
      {isWhite && (
        <ContactShadows 
          position={[0, -1.2, 0]} 
          opacity={0.8} 
          scale={10} 
          blur={2.5} 
          far={4} 
          color="#ff0000" 
        />
      )}
    </group>
  );
}

export default function StatueBackground({ color, textureUrl, modelUrl, useOriginalMaterial }: { color: string; textureUrl?: string; modelUrl?: string; useOriginalMaterial?: boolean }) {
  const isWhite = color.toLowerCase() === '#ffffff' || color.toLowerCase() === 'white';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ background: 'transparent' }}>
      <div className="hidden md:block w-full h-full">
        <Canvas 
          shadows={false} 
          camera={{ position: [0, 0, 5], fov: 45 }}
          style={{ pointerEvents: 'none' }}
        >
          <AmbientLight intensity={0.8} />
          <PointLight position={[10, 10, 10]} intensity={1} />
          <DirectionalLight position={[-5, 5, 5]} intensity={1.5} />
          <React.Suspense fallback={null}>
            <Statue 
              key={`${modelUrl || 'default'}-${useOriginalMaterial ? 'orig' : 'custom'}`} 
              color={color} 
              textureUrl={textureUrl} 
              modelUrl={modelUrl} 
              useOriginalMaterial={useOriginalMaterial} 
            />
          </React.Suspense>
        </Canvas>
      </div>

      {/* Thicker Manga Dot (Halftone) Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.25]" 
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1.5px, transparent 1.5px)`,
          backgroundSize: '6px 6px',
          color: isWhite ? '#ff0000' : color, // Dots turn red when white to match the shadow request
          maskImage: 'radial-gradient(ellipse at center, black, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 90%)',
        }}
      />
      
      {/* Depth Shadow */}
      <div className="absolute inset-0 shadow-[inner_0_0_150px_rgba(0,0,0,0.15)] pointer-events-none" />
    </div>
  );
}
