import { DualRecordingOutput, OmanEventPreset } from '../types';

export class DualVideoRecorder {
  private videoElement: HTMLVideoElement;
  private audioStream: MediaStream | null = null;
  private canvas16x9: HTMLCanvasElement;
  private canvas9x16: HTMLCanvasElement;
  private ctx16x9: CanvasRenderingContext2D | null;
  private ctx9x16: CanvasRenderingContext2D | null;
  private recorder16x9: MediaRecorder | null = null;
  private recorder9x16: MediaRecorder | null = null;
  private chunks16x9: Blob[] = [];
  private chunks9x16: Blob[] = [];
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private isRecording: boolean = false;
  private preset: OmanEventPreset;

  constructor(videoElement: HTMLVideoElement, audioStream: MediaStream | null, preset: OmanEventPreset) {
    this.videoElement = videoElement;
    this.audioStream = audioStream;
    this.preset = preset;

    this.canvas16x9 = document.createElement('canvas');
    this.canvas16x9.width = 1280;
    this.canvas16x9.height = 720;
    this.ctx16x9 = this.canvas16x9.getContext('2d');

    this.canvas9x16 = document.createElement('canvas');
    this.canvas9x16.width = 720;
    this.canvas9x16.height = 1280;
    this.ctx9x16 = this.canvas9x16.getContext('2d');
  }

  public start() {
    this.chunks16x9 = [];
    this.chunks9x16 = [];
    this.isRecording = true;
    this.startTime = Date.now();

    const render = () => {
      if (!this.isRecording) return;
      this.drawFrames();
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();

    const fps = 30;
    const stream16x9 = this.canvas16x9.captureStream(fps);
    const stream9x16 = this.canvas9x16.captureStream(fps);

    if (this.audioStream && this.audioStream.getAudioTracks().length > 0) {
      const audioTrack = this.audioStream.getAudioTracks()[0];
      stream16x9.addTrack(audioTrack.clone());
      stream9x16.addTrack(audioTrack.clone());
    }

    const mimeType = this.getSupportedMimeType();

    try {
      this.recorder16x9 = new MediaRecorder(stream16x9, {
        mimeType,
        videoBitsPerSecond: 6_000_000,
      });
      this.recorder16x9.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.chunks16x9.push(e.data);
      };
      this.recorder16x9.start(250);

      this.recorder9x16 = new MediaRecorder(stream9x16, {
        mimeType,
        videoBitsPerSecond: 6_000_000,
      });
      this.recorder9x16.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.chunks9x16.push(e.data);
      };
      this.recorder9x16.start(250);
    } catch (err) {
      console.error('Failed to initialize MediaRecorder with preferred codec, falling back:', err);
      this.recorder16x9 = new MediaRecorder(stream16x9);
      this.recorder16x9.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.chunks16x9.push(e.data);
      };
      this.recorder16x9.start(250);

      this.recorder9x16 = new MediaRecorder(stream9x16);
      this.recorder9x16.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.chunks9x16.push(e.data);
      };
      this.recorder9x16.start(250);
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/webm',
      'video/mp4',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  private drawFrames() {
    const video = this.videoElement;
    if (!video || video.readyState < 2) return;

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;

    if (this.ctx16x9) {
      this.ctx16x9.drawImage(video, 0, 0, this.canvas16x9.width, this.canvas16x9.height);

      this.ctx16x9.fillStyle = 'rgba(15, 23, 42, 0.65)';
      if (typeof this.ctx16x9.roundRect === 'function') {
        this.ctx16x9.roundRect(20, 20, 260, 36, 8);
      } else {
        this.ctx16x9.rect(20, 20, 260, 36);
      }
      this.ctx16x9.fill();

      this.ctx16x9.fillStyle = '#10b981';
      this.ctx16x9.beginPath();
      this.ctx16x9.arc(36, 38, 5, 0, Math.PI * 2);
      this.ctx16x9.fill();

      this.ctx16x9.fillStyle = '#ffffff';
      this.ctx16x9.font = 'bold 13px Cairo, sans-serif';
      this.ctx16x9.fillText(`${this.preset.icon} ${this.preset.name.slice(0, 24)}`, 48, 43);
    }

    if (this.ctx9x16) {
      const targetAspect = 9 / 16;
      let sourceWidth = vh * targetAspect;
      let sourceHeight = vh;
      let sourceX = (vw - sourceWidth) / 2;
      let sourceY = 0;

      if (sourceWidth > vw) {
        sourceWidth = vw;
        sourceHeight = vw / targetAspect;
        sourceX = 0;
        sourceY = (vh - sourceHeight) / 2;
      }

      this.ctx9x16.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        this.canvas9x16.width,
        this.canvas9x16.height
      );

      this.ctx9x16.fillStyle = 'rgba(15, 23, 42, 0.7)';
      if (typeof this.ctx9x16.roundRect === 'function') {
        this.ctx9x16.roundRect(20, 30, 280, 42, 10);
      } else {
        this.ctx9x16.rect(20, 30, 280, 42);
      }
      this.ctx9x16.fill();

      this.ctx9x16.fillStyle = '#f59e0b';
      this.ctx9x16.beginPath();
      this.ctx9x16.arc(38, 51, 6, 0, Math.PI * 2);
      this.ctx9x16.fill();

      this.ctx9x16.fillStyle = '#ffffff';
      this.ctx9x16.font = 'bold 14px Cairo, sans-serif';
      this.ctx9x16.fillText(`${this.preset.name.slice(0, 20)} [9:16]`, 52, 56);
    }
  }

  public async stop(): Promise<DualRecordingOutput> {
    this.isRecording = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

    const stopRecorder = (recorder: MediaRecorder | null, chunks: Blob[]): Promise<Blob> => {
      return new Promise((resolve) => {
        if (!recorder || recorder.state === 'inactive') {
          resolve(new Blob(chunks, { type: 'video/mp4' }));
          return;
        }
        recorder.onstop = () => {
          const type = recorder.mimeType || 'video/mp4';
          resolve(new Blob(chunks, { type }));
        };
        recorder.stop();
      });
    };

    const [blob16x9, blob9x16] = await Promise.all([
      stopRecorder(this.recorder16x9, this.chunks16x9),
      stopRecorder(this.recorder9x16, this.chunks9x16),
    ]);

    const timestamp = Date.now();
    const dateStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
    const safeEventSlug = this.preset.id;

    const url16x9 = URL.createObjectURL(blob16x9);
    const url9x16 = URL.createObjectURL(blob9x16);

    return {
      id: `rec-${timestamp}`,
      timestamp,
      durationSeconds,
      eventName: this.preset.name,
      location: this.preset.location,
      landscapeVideo: {
        blob: blob16x9,
        url: url16x9,
        aspectRatio: '16:9',
        resolution: '1920x1080 (FHD 16:9)',
        filename: `JCA_${safeEventSlug}_16x9_${dateStr}.mp4`,
        fileSizeBytes: blob16x9.size,
      },
      portraitVideo: {
        blob: blob9x16,
        url: url9x16,
        aspectRatio: '9:16',
        resolution: '1080x1920 (Social 9:16)',
        filename: `JCA_${safeEventSlug}_9x16_${dateStr}.mp4`,
        fileSizeBytes: blob9x16.size,
      },
    };
  }
}