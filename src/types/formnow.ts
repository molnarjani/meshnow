export type FileType = "STL" | "OBJ";

export type UploadStatus = "PENDING" | "UPLOADED" | "FAILED";

export interface InitializeUploadRequest {
  file_type: FileType;
  file_name: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeUploadResponse {
  id: string;
  signed_url: string;
  status: UploadStatus;
  file_type: FileType;
  file_name: string;
  created_at: string;
}

export interface UpdateUploadStatusRequest {
  status: UploadStatus;
}

export interface PartFileResponse {
  id: string;
  status: UploadStatus;
  file_type: FileType;
  file_name: string;
  redirect_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FormNowError {
  error: string;
  message?: string;
}
