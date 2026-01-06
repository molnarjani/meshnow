"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { MeshyTask } from "@/types/meshy";
import ProgressBar from "@/components/ProgressBar";
import DownloadButtons from "@/components/DownloadButtons";
import ImageUpload from "@/components/ImageUpload";
import MultiImageUpload from "@/components/MultiImageUpload";

type GenerationMode = "text-to-3d" | "image-to-3d" | "multi-image-to-3d";

// Dynamic import for ModelViewer to avoid SSR issues with Three.js
const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-900 rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  ),
});

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState<GenerationMode>("text-to-3d");
  const [prompt, setPrompt] = useState("");
  const [artStyle, setArtStyle] = useState<"realistic" | "sculpture">("realistic");
  const [singleImage, setSingleImage] = useState<string | null>(null);
  const [multiImages, setMultiImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<MeshyTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getStatusEndpoint = useCallback(() => {
    switch (mode) {
      case "text-to-3d":
        return `/api/meshy/status/${taskId}`;
      case "image-to-3d":
        return `/api/meshy/image-to-3d/status/${taskId}`;
      case "multi-image-to-3d":
        return `/api/meshy/multi-image-to-3d/status/${taskId}`;
    }
  }, [mode, taskId]);

  const pollTaskStatus = useCallback(async () => {
    if (!taskId || !apiKey) return;

    try {
      const response = await fetch(getStatusEndpoint(), {
        headers: {
          "x-api-key": apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch task status");
      }

      const taskData: MeshyTask = await response.json();
      setTask(taskData);

      if (taskData.status === "SUCCEEDED" || taskData.status === "FAILED" || taskData.status === "CANCELED") {
        setIsGenerating(false);
        if (taskData.status === "FAILED") {
          setError(taskData.task_error?.message || "Generation failed");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch task status");
      setIsGenerating(false);
    }
  }, [taskId, apiKey, getStatusEndpoint]);

  useEffect(() => {
    if (!isGenerating || !taskId) return;

    const interval = setInterval(pollTaskStatus, 2000);
    pollTaskStatus(); // Initial poll

    return () => clearInterval(interval);
  }, [isGenerating, taskId, pollTaskStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTask(null);
    setTaskId(null);

    if (!apiKey.trim()) {
      setError("Please enter your Meshy API key");
      return;
    }

    // Validation based on mode
    if (mode === "text-to-3d" && !prompt.trim()) {
      setError("Please enter a prompt describing your 3D model");
      return;
    }

    if (mode === "image-to-3d" && !singleImage) {
      setError("Please upload an image");
      return;
    }

    if (mode === "multi-image-to-3d" && multiImages.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    setIsGenerating(true);

    try {
      let endpoint: string;
      let body: Record<string, unknown>;

      switch (mode) {
        case "text-to-3d":
          endpoint = "/api/meshy/create";
          body = { apiKey, prompt, artStyle };
          break;
        case "image-to-3d":
          endpoint = "/api/meshy/image-to-3d";
          body = { apiKey, imageUrl: singleImage };
          break;
        case "multi-image-to-3d":
          endpoint = "/api/meshy/multi-image-to-3d";
          body = { apiKey, imageUrls: multiImages };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const data = await response.json();
      setTaskId(data.taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setTask(null);
    setTaskId(null);
    setError(null);
    setPrompt("");
    setSingleImage(null);
    setMultiImages([]);
  };

  const handleModeChange = (newMode: GenerationMode) => {
    if (isGenerating) return;
    setMode(newMode);
    setError(null);
    setTask(null);
    setTaskId(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-4">
            MeshNow
          </h1>
          <p className="text-gray-300 text-lg">
            Transform your ideas into stunning 3D models using AI
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700">
          {/* Mode Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => handleModeChange("text-to-3d")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === "text-to-3d"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isGenerating}
            >
              Text to 3D
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("image-to-3d")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === "image-to-3d"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isGenerating}
            >
              Image to 3D
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("multi-image-to-3d")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === "multi-image-to-3d"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isGenerating}
            >
              Multi-Image to 3D
            </button>
          </div>

          {/* API Key Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
                Meshy API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Meshy API key"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={isGenerating}
              />
              <p className="mt-1 text-xs text-gray-500">
                Get your API key from{" "}
                <a
                  href="https://www.meshy.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  meshy.ai
                </a>
              </p>
            </div>

            {/* Text to 3D Inputs */}
            {mode === "text-to-3d" && (
              <>
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                    Describe your 3D model
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., a cute dragon with purple scales, a futuristic robot, a medieval castle..."
                    rows={3}
                    maxLength={600}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    disabled={isGenerating}
                  />
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {prompt.length}/600 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="artStyle" className="block text-sm font-medium text-gray-300 mb-2">
                    Art Style
                  </label>
                  <select
                    id="artStyle"
                    value={artStyle}
                    onChange={(e) => setArtStyle(e.target.value as "realistic" | "sculpture")}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    disabled={isGenerating}
                  >
                    <option value="realistic">Realistic</option>
                    <option value="sculpture">Sculpture</option>
                  </select>
                </div>
              </>
            )}

            {/* Image to 3D Input */}
            {mode === "image-to-3d" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Image
                </label>
                <ImageUpload
                  onImageSelect={setSingleImage}
                  disabled={isGenerating}
                  imagePreview={singleImage}
                />
              </div>
            )}

            {/* Multi-Image to 3D Input */}
            {mode === "multi-image-to-3d" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Images (1-4)
                </label>
                <MultiImageUpload
                  onImagesSelect={setMultiImages}
                  disabled={isGenerating}
                  imagePreviews={multiImages}
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
                {error}
              </div>
            )}

            {/* Progress Section */}
            {isGenerating && task && (
              <div className="space-y-4">
                <ProgressBar progress={task.progress} status={task.status} />
                {task.preceding_tasks > 0 && (
                  <p className="text-sm text-gray-400 text-center">
                    {task.preceding_tasks} task(s) ahead in queue
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            {!task?.model_urls?.glb && (
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    {mode === "text-to-3d" && "Generate from Text"}
                    {mode === "image-to-3d" && "Generate from Image"}
                    {mode === "multi-image-to-3d" && "Generate from Images"}
                  </>
                )}
              </button>
            )}
          </form>

          {/* Result Section */}
          {task?.status === "SUCCEEDED" && task.model_urls?.glb && (
            <div className="mt-8 space-y-6">
              <div className="border-t border-gray-600 pt-6">
                <h2 className="text-2xl font-bold text-white mb-4">Your 3D Model</h2>
                <ModelViewer modelUrl={task.model_urls.glb} />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                <DownloadButtons task={task} />
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Create New Model
                </button>
              </div>

              {task.thumbnail_url && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Thumbnail</h3>
                  <img
                    src={task.thumbnail_url}
                    alt="Model thumbnail"
                    className="rounded-lg max-w-xs border border-gray-600"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
