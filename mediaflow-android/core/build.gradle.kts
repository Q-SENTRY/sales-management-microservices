plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.mediaflow.core"
    compileSdk = 35
    defaultConfig {
        minSdk = 29
        consumerProguardFiles("consumer-rules.pro")
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures { compose = true }
}

kotlin {
    compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) }
}

dependencies {
    api(project(":domain"))
    api(platform(libs.compose.bom))
    api(libs.compose.ui)
    api(libs.compose.foundation)
    api(libs.compose.animation)
    api(libs.compose.material3)
    api(libs.compose.material.icons)
    api(libs.compose.ui.tooling.preview)
    api(libs.androidx.core.ktx)
    api(libs.coroutines.android)
    debugApi(libs.compose.ui.tooling)
}
