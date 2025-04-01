package com.myvoiceapp;

import android.util.Log;
import com.chaquo.python.PyObject;
import com.chaquo.python.Python;
import com.chaquo.python.android.AndroidPlatform;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class PythonServerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "PythonServerModule";
    private static boolean serverStarted = false;

    public PythonServerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        initPython(reactContext);
    }

    private void initPython(ReactApplicationContext context) {
        if (!Python.isStarted()) {
            try {
                Python.start(new AndroidPlatform(context));
                Log.d(TAG, "Python runtime initialized");
            } catch (Exception e) {
                Log.e(TAG, "Failed to start Python: " + e.getMessage());
            }
        }
    }

    @Override
    public String getName() {
        return "PythonServer";
    }

    @ReactMethod
    public void startServer(Promise promise) {
        if (serverStarted) {
            promise.resolve("Server already running");
            return;
        }

        try {
            Python py = Python.getInstance();
            PyObject module = py.getModule("server_bridge");
            PyObject result = module.callAttr("start_python_server");
            serverStarted = true;
            promise.resolve(result.toString());
        } catch (Exception e) {
            Log.e(TAG, "Error starting Python server: " + e.getMessage());
            promise.reject("SERVER_ERROR", "Failed to start Python server: " + e.getMessage());
        }
    }

    @ReactMethod
    public void isServerRunning(Promise promise) {
        promise.resolve(serverStarted);
    }
}
