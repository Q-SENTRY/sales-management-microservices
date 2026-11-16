plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.mediaflow.player"
    compileSdk = 35
    defaultConfig {
        minSdk = 29
        consumerProguardFiles("consumer-rules.pro")
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) }
}

dependencies {
    api(project(":domain"))
    implementation(project(":core"))
    api(libs.media3.exoplayer)
    api(libs.media3.session)
    api(libs.media3.ui)
    implementation(libs.coroutines.guava)
    implementation(libs.coroutines.android)
}
