export interface MeshyTask {
  id: string;
  type: string;
  model_urls: {
    glb?: string;
    fbx?: string;
    obj?: string;
    mtl?: string;
    usdz?: string;
  };
  thumbnail_url: string;
  prompt: string;
  art_style: string;
  progress: number;
  started_at: number;
  created_at: number;
  finished_at: number;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";
  texture_urls: Array<{
    base_color?: string;
    metallic?: string;
    normal?: string;
    roughness?: string;
  }>;
  preceding_tasks: number;
  task_error: {
    message: string;
  };
}

export interface CreateTaskResponse {
  taskId: string;
}

export interface CreateTaskRequest {
  apiKey: string;
  prompt: string;
  artStyle?: "realistic" | "sculpture";
}
