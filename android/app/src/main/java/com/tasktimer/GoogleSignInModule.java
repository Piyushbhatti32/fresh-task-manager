package com.tasktimer;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public class GoogleSignInModule extends ReactContextBaseJavaModule {
    private static final int RC_SIGN_IN = 9001;
    private GoogleSignInClient mGoogleSignInClient;
    private Promise mPromise;

    private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == RC_SIGN_IN) {
                Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
                handleSignInResult(task);
            }
        }
    };

    public GoogleSignInModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(mActivityEventListener);
    }

    @Override
    public String getName() {
        return "GoogleSignIn";
    }

    @ReactMethod
    public void configure(String webClientId, Promise promise) {
        try {
            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(webClientId)
                    .requestEmail()
                    .build();

            mGoogleSignInClient = GoogleSignIn.getClient(getReactApplicationContext(), gso);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("CONFIG_ERROR", e);
        }
    }

    @ReactMethod
    public void signIn(Promise promise) {
        try {
            mPromise = promise;
            Intent signInIntent = mGoogleSignInClient.getSignInIntent();
            getCurrentActivity().startActivityForResult(signInIntent, RC_SIGN_IN);
        } catch (Exception e) {
            promise.reject("SIGN_IN_ERROR", e);
        }
    }

    @ReactMethod
    public void signOut(Promise promise) {
        try {
            mGoogleSignInClient.signOut()
                    .addOnCompleteListener(task -> {
                        if (task.isSuccessful()) {
                            promise.resolve(null);
                        } else {
                            promise.reject("SIGN_OUT_ERROR", task.getException());
                        }
                    });
        } catch (Exception e) {
            promise.reject("SIGN_OUT_ERROR", e);
        }
    }

    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            if (mPromise != null) {
                mPromise.resolve(account.getIdToken());
            }
        } catch (ApiException e) {
            if (mPromise != null) {
                mPromise.reject("SIGN_IN_ERROR", e);
            }
        }
    }
} 