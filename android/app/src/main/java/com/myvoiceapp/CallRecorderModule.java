package com.myvoiceapp;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Environment;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class CallRecorderModule extends ReactContextBaseJavaModule {
    private static final String TAG = "CallRecorderModule";
    private final ReactApplicationContext reactContext;
    private MediaRecorder mediaRecorder;
    private String currentRecordingPath;
    private TelephonyManager telephonyManager;
    private PhoneStateListener phoneStateListener;
    private boolean isRecording = false;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(int requestCode, int resultCode, Intent data) {
            if (requestCode == PERMISSION_REQUEST_CODE) {
                if (resultCode == Activity.RESULT_OK) {
                    // Permission granted, start recording
                    startRecording();
                } else {
                    // Permission denied
                    sendEvent("onCallRecordingError", "Permission denied");
                }
            }
        }
    };

    public CallRecorderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        reactContext.addActivityEventListener(activityEventListener);
        initializeTelephonyManager();
    }

    private void initializeTelephonyManager() {
        telephonyManager = (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);
        phoneStateListener = new PhoneStateListener() {
            @Override
            public void onCallStateChanged(int state, String phoneNumber) {
                switch (state) {
                    case TelephonyManager.CALL_STATE_RINGING:
                        // Call is ringing
                        break;
                    case TelephonyManager.CALL_STATE_OFFHOOK:
                        // Call is answered
                        if (!isRecording) {
                            startRecording();
                        }
                        break;
                    case TelephonyManager.CALL_STATE_IDLE:
                        // Call ended
                        if (isRecording) {
                            stopRecording();
                        }
                        break;
                }
            }
        };
        telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE);
    }

    @Override
    public String getName() {
        return "CallRecorderModule";
    }

    @ReactMethod
    public void initialize(Promise promise) {
        try {
            // Check for required permissions
            if (!checkPermissions()) {
                requestPermissions();
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    private boolean checkPermissions() {
        return ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED
                && ContextCompat.checkSelfPermission(reactContext, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPermissions() {
        ActivityCompat.requestPermissions(getCurrentActivity(),
                new String[]{
                        Manifest.permission.RECORD_AUDIO,
                        Manifest.permission.READ_PHONE_STATE,
                        Manifest.permission.WRITE_EXTERNAL_STORAGE
                },
                PERMISSION_REQUEST_CODE);
    }

    @ReactMethod
    public void startRecording(Promise promise) {
        try {
            if (!checkPermissions()) {
                requestPermissions();
                return;
            }

            String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
            String fileName = "CALL_" + timeStamp + ".mp3";
            File storageDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC);
            File audioFile = new File(storageDir, fileName);
            currentRecordingPath = audioFile.getAbsolutePath();

            mediaRecorder = new MediaRecorder();
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.VOICE_COMMUNICATION);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.setOutputFile(currentRecordingPath);
            mediaRecorder.prepare();
            mediaRecorder.start();
            isRecording = true;

            sendEvent("onCallRecordingStarted", null);
            promise.resolve(true);
        } catch (IOException e) {
            Log.e(TAG, "Error starting recording", e);
            sendEvent("onCallRecordingError", e.getMessage());
            promise.reject("RECORDING_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopRecording(Promise promise) {
        try {
            if (mediaRecorder != null && isRecording) {
                mediaRecorder.stop();
                mediaRecorder.release();
                mediaRecorder = null;
                isRecording = false;

                // Send recording data to React Native
                sendEvent("onCallRecordingStopped", currentRecordingPath);
                promise.resolve(currentRecordingPath);
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping recording", e);
            sendEvent("onCallRecordingError", e.getMessage());
            promise.reject("STOP_ERROR", e.getMessage());
        }
    }

    private void sendEvent(String eventName, String data) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, data);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (telephonyManager != null && phoneStateListener != null) {
            telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE);
        }
        if (mediaRecorder != null) {
            mediaRecorder.release();
            mediaRecorder = null;
        }
    }
} 