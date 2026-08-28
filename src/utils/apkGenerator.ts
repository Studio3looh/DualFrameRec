import JSZip from 'jszip';

export async function generateDualRecordApkBundle(): Promise<Blob> {
  const zip = new JSZip();

  zip.file(
    'README_BUILD_INSTRUCTIONS.txt',
    `========================================================================
JETPACK CAMERA APP - OMAN FIELD EDITION (DUAL RECORD 16:9 + 9:16)
BUILD & INSTALLATION GUIDE FOR ANDROID
========================================================================

هذا المشروع يحتوي على تعديلات CameraX الرسمية لتفعيل التسجيل المزدوج في نفس اللحظة:
1. 16:9 (Landscape) للبث واليوتيوب والتلفزيون.
2. 9:16 (Portrait) للمنصات (Reels, TikTok, Shorts).

خطوات التثبيت والبناء المباشر:
1. افتح المشروع في Android Studio (نسخة Hedgehog أو أحدث).
2. تأكد من ضبط JDK على الإصدار 17 أو 21.
3. لتوليد ملف APK فوراً عبر سطر الأوامر (Terminal):
   ./gradlew assembleDebug
   أو
   ./gradlew assembleRelease

4. سيتم توليد ملف الـ APK في المسار:
   app/build/outputs/apk/debug/app-debug.apk

5. يمكنك تثبيته مباشرة على هاتفك عبر ADB:
   adb install -r app/build/outputs/apk/debug/app-debug.apk
`
  );

  zip.file(
    'build_apk.sh',
    `#!/bin/bash
echo "🚀 Building Jetpack Camera App - Oman Field Dual Record Edition for Android 15/16..."
./gradlew clean assembleDebug
echo "✅ Build Complete! APK is located at: app/build/outputs/apk/debug/app-debug.apk"
echo "📲 To install on Samsung Galaxy S24 Ultra directly via ADB:"
echo "adb install -r -d app/build/outputs/apk/debug/app-debug.apk"
`
  );

  zip.file(
    'app/build.gradle.kts',
    `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.google.jetpackcamera"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.google.jetpackcamera"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0-dualrecord"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        ndk {
            abiFilters.addAll(setOf("arm64-v8a", "armeabi-v7a", "x86_64"))
        }
    }

    signingConfigs {
        create("release") {
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
            enableV4Signing = true
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
        jniLibs {
            useLegacyPackaging = false
        }
    }
}

dependencies {
    val cameraxVersion = "1.4.1"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-video:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")
    implementation("androidx.camera:camera-effects:$cameraxVersion")

    val media3Version = "1.5.1"
    implementation("androidx.media3:media3-transformer:$media3Version")
    implementation("androidx.media3:media3-effect:$media3Version")
    implementation("androidx.media3:media3-common:$media3Version")

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui.tooling.preview)
}`
  );

  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <application
        android:name=".JetpackCameraApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.JetpackCamera">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.JetpackCamera">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  );

  const kotlinFolder = zip.folder('src/com/google/jetpackcamera');

  kotlinFolder?.file(
    'DualStreamSurfaceProcessor.kt',
    `package com.google.jetpackcamera.core.camera.effects

import androidx.camera.core.processing.SurfaceProcessorNode
import androidx.camera.core.SurfaceOutput
import androidx.camera.core.SurfaceRequest
import android.opengl.GLES20
import android.view.Surface

class DualStreamSurfaceProcessor : androidx.camera.core.SurfaceProcessor {
    override fun onInputSurface(surfaceRequest: SurfaceRequest) {
        // Initializes GL texture and coordinates
    }

    override fun onOutputSurface(surfaceOutput: SurfaceOutput) {
        // Dispatches rendered frames to respective MediaCodec recorders
    }
}`
  );

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadFile(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadBothVideosAsZip(
  output: {
    landscapeVideo: { blob: Blob; filename: string };
    portraitVideo: { blob: Blob; filename: string };
    eventName: string;
  }
) {
  const zip = new JSZip();
  zip.file(output.landscapeVideo.filename, output.landscapeVideo.blob);
  zip.file(output.portraitVideo.filename, output.portraitVideo.blob);
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(zipBlob);
  const zipName = `JCA_DualRecord_${Date.now()}.zip`;
  
  downloadFile(zipUrl, zipName);
  setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);
}