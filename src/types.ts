export type CaptureModeType = 'VIDEO' | 'PHOTO';

export type AspectRatioType = '16:9' | '9:16' | '4:3' | '1:1';

export type VideoQualityType = 'SD' | 'HD' | 'FHD' | 'UHD';

export interface OmanEventPreset {
  id: string;
  name: string;
  category: 'sports' | 'cultural' | 'heritage' | 'general';
  location: string;
  icon: string;
}

export interface DualRecordingOutput {
  id: string;
  timestamp: number;
  durationSeconds: number;
  eventName: string;
  location: string;
  landscapeVideo: {
    blob: Blob;
    url: string;
    aspectRatio: '16:9';
    resolution: string;
    filename: string;
    fileSizeBytes: number;
  };
  portraitVideo: {
    blob: Blob;
    url: string;
    aspectRatio: '9:16';
    resolution: string;
    filename: string;
    fileSizeBytes: number;
  };
}

export interface CameraSettings {
  dualRecordEnabled: boolean;
  videoQuality: VideoQualityType;
  fps: 30 | 60;
  audioEnabled: boolean;
  selectedPreset: OmanEventPreset;
  gridLines: boolean;
  stabilization: boolean;
  torch: boolean;
  lensFacing: 'front' | 'back';
}