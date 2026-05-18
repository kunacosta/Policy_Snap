package com.onyxxtech.policysnap;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Disable WebView's native pinch-to-zoom gesture recognizer so that
        // two-finger touch events are forwarded to JS pointer events instead
        // of being consumed by the WebView's ScaleGestureDetector.
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
    }
}
