// package com.reclaim;
// import com.reclaim.UsageStatsPackage;
// import android.app.Application;
// import com.facebook.react.PackageList;
// import com.facebook.react.ReactApplication;
// import com.facebook.react.ReactNativeHost;
// import com.facebook.react.ReactPackage;
// import com.facebook.react.soloader.OpenSourceMergedSoMapping;
// import com.facebook.soloader.SoLoader;

// import java.util.List;

// public class MainApplication extends Application implements ReactApplication {

//     private final ReactNativeHost mReactNativeHost =
//         new ReactNativeHost(this) {
//             @Override
//             public boolean getUseDeveloperSupport() {
//                 return BuildConfig.DEBUG;
//             }

//             @Override
//             protected List<ReactPackage> getPackages() {
//                 List<ReactPackage> packages = new PackageList(this).getPackages();
//                 // packages.add(new UsageStatsPackage());
//                 return packages;
//             }

//             @Override
//             protected String getJSMainModuleName() {
//                 return "index";
//             }
//         };

//     @Override
//     public ReactNativeHost getReactNativeHost() {
//         return mReactNativeHost;
//     }

//     @Override
//     public void onCreate() {
//         super.onCreate();
//         SoLoader.init(this, OpenSourceMergedSoMapping);
//     }
// }

package com.reclaim
import com.reclaim.UsageStatsPackage
import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.NativeModule
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Add our custom packages
              add(object : ReactPackage {
                override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
                  return listOf(
                    UsageStatsModule(reactContext),
                    AppBlockerModule(reactContext),
                    OverlayModule(reactContext),
                    AppListModule(reactContext),
                    FocusTimerModule(reactContext)
                  )
                }

                override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
                  return emptyList()
                }
              })
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }

  }
}

