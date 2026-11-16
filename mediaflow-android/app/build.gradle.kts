import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.mediaflow.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.mediaflow.app"
        minSdk = 29
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        // Billing aún no está integrado: permite previsualizar Premium en pruebas.
        buildConfigField("boolean", "PREMIUM_PREVIEW", "true")
    }

    signingConfigs {
        if (keystoreProps.isNotEmpty()) {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    testOptions {
        unitTests.isIncludeAndroidResources = true
        unitTests.all { it.systemProperty("screens.dir", rootProject.file("docs/screenshots").absolutePath) }
    }
    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

kotlin {
    compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) }
}

dependencies {
    implementation(project(":core"))
    implementation(project(":domain"))
    implementation(project(":data"))
    implementation(project(":presentation"))
    implementation(project(":downloader"))
    implementation(project(":media_converter"))
    implementation(project(":media_player"))
    implementation(project(":library"))
    implementation(project(":platform_integrations:api"))
    implementation(project(":platform_integrations:youtube"))
    implementation(project(":platform_integrations:tiktok"))
    implementation(project(":platform_integrations:instagram"))
    implementation(project(":platform_integrations:facebook"))
    implementation(project(":platform_integrations:direct"))

    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.splashscreen)
    implementation(libs.androidx.lifecycle.process)
    implementation(libs.work.runtime)
    implementation(libs.coil.compose)

    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(platform(libs.compose.bom))
    testImplementation(libs.compose.ui.test.junit4)
    debugImplementation(libs.compose.ui.test.manifest)
}
