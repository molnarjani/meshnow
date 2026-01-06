"use client";

interface ProgressBarProps {
  progress: number;
  status: string;
}

export default function ProgressBar({ progress, status }: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case "SUCCEEDED":
        return "bg-green-500";
      case "FAILED":
      case "CANCELED":
        return "bg-red-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "PENDING":
        return "Waiting in queue...";
      case "IN_PROGRESS":
        return "Generating 3D model...";
      case "SUCCEEDED":
        return "Generation complete!";
      case "FAILED":
        return "Generation failed";
      case "CANCELED":
        return "Generation canceled";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-300">{getStatusText()}</span>
        <span className="text-sm font-medium text-gray-300">{progress}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
