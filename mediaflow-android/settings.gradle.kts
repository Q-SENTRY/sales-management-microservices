pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "MediaFlow"

include(
    ":app",
    ":core",
    ":domain",
    ":data",
    ":presentation",
    ":downloader",
    ":media_converter",
    ":media_player",
    ":library",
    ":platform_integrations:api",
    ":platform_integrations:youtube",
    ":platform_integrations:tiktok",
    ":platform_integrations:instagram",
    ":platform_integrations:facebook",
    ":platform_integrations:direct",
)
