"use client";

import { useState } from "react";
import { FileType, PartFileResponse } from "@/types/formnow";

interface FormNowUploadProps {
  apiKey: string;
  externalFile?: File | null;
  modelUrl?: string; // New prop for direct URL
  onSuccess?: (data: PartFileResponse) => void;
  onError?: (error: string) => void;
}

export default function FormNowUpload({ apiKey, externalFile, modelUrl, onSuccess, onError }: FormNowUploadProps) {
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  // Use external file if provided, otherwise fallback to internal state
  const file = externalFile || internalFile;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (extension === "stl" || extension === "obj") {
        setInternalFile(selectedFile);
        setRedirectUrl(null);
      } else {
        onError?.("Please select a valid STL or OBJ file");
      }
    }
  };

  const handleUpload = async () => {
    if (!apiKey) {
      onError?.("Form Now API key is missing. Please check your environment variables.");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Preparing upload...");
    setRedirectUrl(null);

    let fileToUpload = file;

    try {
      if (!fileToUpload && modelUrl) {
         setUploadProgress("Fetching model from Meshy...");
         // Use proxy to avoid CORS issues
         const response = await fetch(`/api/proxy?url=${encodeURIComponent(modelUrl)}`);
         if (!response.ok) {
            throw new Error(`Failed to fetch model: ${response.statusText}`);
         }
         const blob = await response.blob();
         fileToUpload = new File([blob], "meshy-model.obj", { type: "model/obj" });
      }

      if (!fileToUpload || !apiKey) {
        throw new Error("File or API key missing");
      }

      const extension = fileToUpload.name.split(".").pop()?.toUpperCase() as FileType;
      const fileType = extension === "OBJ" ? "OBJ" : "STL";

      // Step 1: Initialize upload
      setUploadProgress("Initializing upload...");
      const initResponse = await fetch("/api/formnow/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": apiKey,
        },
        body: JSON.stringify({
          file_type: fileType,
          file_name: fileToUpload.name,
          metadata: {
            source: "meshnow-app",
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || "Failed to initialize upload");
      }

      const initData = await initResponse.json();
      const { id, signed_url } = initData;

      // Step 2: Upload file to signed URL
      setUploadProgress("Uploading file to Form Now...");
      const uploadResponse = await fetch(signed_url, {
        method: "PUT",
        body: fileToUpload,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Storage upload failed: ${uploadResponse.statusText}`);
      }

      // Step 3: Update status to UPLOADED
      setUploadProgress("Finalizing upload...");
      const updateResponse = await fetch(`/api/formnow/update-status/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": apiKey,
        },
        body: JSON.stringify({
          status: "UPLOADED",
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      const finalData: PartFileResponse = await updateResponse.json();
      setUploadProgress("Upload complete!");

      if (finalData.redirect_url) {
        setRedirectUrl(finalData.redirect_url);
      }

      onSuccess?.(finalData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadProgress("");
      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  if (modelUrl) {
    if (redirectUrl) {
        return (
             <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
             className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 inline-flex items-center gap-2"
          >
            Order on Form Now ➔
          </a>
        )
    }
      return (
        <div className="flex items-center gap-2">
            <button
            onClick={handleUpload}
            disabled={isUploading || !apiKey}
            className="px-6 py-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
            {isUploading ? (
               <>
                 <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                 {uploadProgress}
               </>
            ) : (
                "Order on Form Now"
            )}
            </button>
        </div>
      );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="formnow-file" className="block text-sm font-medium text-gray-200">
          Upload 3D Model for Form Now
        </label>
        <input
          id="formnow-file"
          type="file"
          accept=".stl,.obj"
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {file && (
          <p className="text-sm text-gray-400">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || isUploading || !apiKey}
        className="w-full px-6 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? "Uploading..." : "Upload to Form Now"}
      </button>

      {uploadProgress && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300">{uploadProgress}</p>
        </div>
      )}

      {redirectUrl && (
        <div className="p-4 bg-green-900/30 border border-green-600 rounded-lg space-y-3">
          <h3 className="text-lg font-semibold text-green-400">🎉 Upload Complete!</h3>
          <p className="text-sm text-gray-300">Your model has been uploaded successfully.</p>
          <a
            href={redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Order on Form Now ➔
          </a>
        </div>
      )}
    </div>
  );
}
