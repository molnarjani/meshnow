"use client";

import { MeshyTask } from "@/types/meshy";

interface DownloadButtonsProps {
  task: MeshyTask;
}

export default function DownloadButtons({ task }: DownloadButtonsProps) {
  const handleDownload = async (url: string, format: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `meshnow-model.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  const formats = [
    { key: "glb", label: "GLB", url: task.model_urls.glb },
    { key: "fbx", label: "FBX", url: task.model_urls.fbx },
    { key: "obj", label: "OBJ", url: task.model_urls.obj },
    { key: "usdz", label: "USDZ", url: task.model_urls.usdz },
  ].filter((f) => f.url);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Download Model</h3>
      <div className="flex flex-wrap gap-2">
        {formats.map((format) => (
          <button
            key={format.key}
            onClick={() => handleDownload(format.url!, format.key)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            {format.label}
          </button>
        ))}
      </div>
    </div>
  );
}
