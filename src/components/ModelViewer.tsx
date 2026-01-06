"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF, Center } from "@react-three/drei";
import { Suspense, useMemo } from "react";

interface ModelProps {
  url: string;
}

function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} scale={1} />
    </Center>
  );
}

interface ModelViewerProps {
  modelUrl: string;
}

export default function ModelViewer({ modelUrl }: ModelViewerProps) {
  // Proxy the model URL through our API to avoid CORS issues
  const proxiedUrl = useMemo(() => {
    return `/api/proxy?url=${encodeURIComponent(modelUrl)}`;
  }, [modelUrl]);

  return (
    <div className="w-full h-[500px] bg-gray-900 rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <Model url={proxiedUrl} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={2}
          />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
