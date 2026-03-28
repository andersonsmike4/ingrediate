export default {
  expo: {
    name: "Ingrediate",
    slug: "ingrediate",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "ingrediate",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ingrediate.app",
      infoPlist: {
        NSCameraUsageDescription: "Ingrediate uses the camera to scan ingredients and barcodes.",
        NSPhotoLibraryUsageDescription: "Ingrediate uses the photo library to analyze ingredient photos."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.ingrediate.app",
      permissions: ["CAMERA"]
    },
    plugins: [
      "expo-camera",
      "expo-notifications"
    ],
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || "http://10.0.0.156:3000"
    }
  }
};
