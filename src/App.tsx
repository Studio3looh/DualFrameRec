import React, { useState, useRef, useEffect } from 'react';
import { CameraSettings, DualRecordingOutput, OmanEventPreset } from './types';
import { OMAN_EVENT_PRESETS } from './data/presets';
import { ViewFinder } from './components/ViewFinder';
import { CaptureControls } from './components/CaptureControls';
import { PostCaptureScreen } from './components/PostCaptureScreen';
import { SettingsModal } from './components/SettingsModal';
import { AndroidSourceCodeModal } from './components/AndroidSourceCodeModal';
import { DualVideoRecorder } from './utils/dualRecorder';

export default function App() {
  const [settings, setSettings] = useState<CameraSettings>({
    dualRecordEnabled: true,
    videoQuality: 'FHD',
    fps: 30,
    audioEnabled: true,
    selectedPreset: OMAN_EVENT_PRESETS[0],
    gridLines: true,
    stabilization: true,
    torch: false,
    lensFacing: 'back',
  });

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [postCaptureOutput, setPostCaptureOutput] = useState<DualRecordingOutput | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<DualVideoRecorder | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const handleVideoElementReady = (video: HTMLVideoElement, stream: MediaStream | null) => {
    videoElementRef.current = video;
    mediaStreamRef.current = stream;
  };

  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  const handleToggleRecord = async () => {
    if (!videoElementRef.current) return;

    if (!isRecording) {
      const recorder = new DualVideoRecorder(
        videoElementRef.current,
        mediaStreamRef.current,
        settings.selectedPreset
      );
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } else {
      if (recorderRef.current) {
        setIsRecording(false);
        try {
          const output = await recorderRef.current.stop();
          setPostCaptureOutput(output);
        } catch (err) {
          console.error('Error stopping recording:', err);
        }
      }
    }
  };

  const handleToggleDualRecord = () => {
    setSettings((prev) => ({
      ...prev,
      dualRecordEnabled: !prev.dualRecordEnabled,
    }));
  };

  const handleSwitchCamera = () => {
    setSettings((prev) => ({
      ...prev,
      lensFacing: prev.lensFacing === 'back' ? 'front' : 'back',
    }));
  };

  const handleUpdateSettings = (updated: Partial<CameraSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleSelectPreset = (preset: OmanEventPreset) => {
    setSettings((prev) => ({ ...prev, selectedPreset: preset }));
  };

  const handleRetake = () => {
    setPostCaptureOutput(null);
  };

  return (
    <div className="relative w-screen h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {postCaptureOutput ? (
        <PostCaptureScreen
          output={postCaptureOutput}
          onRetake={handleRetake}
        />
      ) : (
        <div className="relative flex-1 flex flex-col w-full h-full">
          <div className="relative flex-1 w-full h-full overflow-hidden">
            <ViewFinder
              settings={settings}
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              onVideoElementReady={handleVideoElementReady}
              onToggleDualRecord={handleToggleDualRecord}
            />
          </div>

          <CaptureControls
            settings={settings}
            isRecording={isRecording}
            onToggleRecord={handleToggleRecord}
            onToggleDualRecord={handleToggleDualRecord}
            onSwitchCamera={handleSwitchCamera}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenCodeModal={() => setIsCodeModalOpen(true)}
            onSelectPreset={handleSelectPreset}
          />
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <AndroidSourceCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}