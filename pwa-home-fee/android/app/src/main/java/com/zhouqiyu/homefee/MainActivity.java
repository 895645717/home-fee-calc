package com.zhouqiyu.homefee;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Keep system bars outside WebView to avoid top content being overlapped.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
