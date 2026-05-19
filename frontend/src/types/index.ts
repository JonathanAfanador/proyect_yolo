export interface BoundingBox {
  x1: number; y1: number; x2: number; y2: number;
  width: number; height: number;
}

export interface Detection {
  label: string;
  confidence: number;
  bounding_box: BoundingBox;
  class_id: number;
}

export interface DetectionResult {
  detection_id: string;
  image_url: string;
  annotated_url?: string;
  detections: Detection[];
  total_objects: number;
  processing_time_ms: number;
  model_version: string;
  created_at: string;
}

export interface RecognitionMatch {
  face_id: string;
  person_name: string;
  distance: number;
  similarity: number;
  verified: boolean;
  bbox?: BoundingBox;
}

export interface RecognitionResult {
  session_id: string;
  faces_found: number;
  matches: RecognitionMatch[];
  processing_time_ms: number;
  image_url: string;
  annotated_url?: string;
  created_at: string;
}

export interface RegisteredFace {
  id: string;
  person_name: string;
  image_url: string;
  created_at: string;
}
