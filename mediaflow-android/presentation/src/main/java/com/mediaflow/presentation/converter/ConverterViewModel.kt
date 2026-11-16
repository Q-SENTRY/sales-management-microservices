package com.mediaflow.presentation.converter

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mediaflow.converter.ConversionOutput
import com.mediaflow.converter.ConversionRequest
import com.mediaflow.domain.model.AudioQuality
import com.mediaflow.domain.model.ConversionFormat
import com.mediaflow.domain.model.ConversionRecord
import com.mediaflow.domain.model.ConversionStatus
import com.mediaflow.domain.model.FeatureGate
import com.mediaflow.domain.model.MediaProbe
import com.mediaflow.domain.model.SizeEstimator
import com.mediaflow.domain.model.Tier
import com.mediaflow.domain.util.FileNames
import com.mediaflow.presentation.di.AppDependencies
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class ConverterUiState(
    val probing: Boolean = false,
    val source: Uri? = null,
    val probe: MediaProbe? = null,
    val format: ConversionFormat = ConversionFormat.M4A,
    val quality: AudioQuality = AudioQuality.STANDARD,
    val outputName: String = "",
    val running: Boolean = false,
    val progress: Float = 0f,
    val result: ConversionOutput? = null,
    val error: String? = null,
) {
    val estimate: Long? get() = probe?.let { SizeEstimator.estimateBytes(it, format, quality) }
    val qualityApplies: Boolean get() = format == ConversionFormat.M4A || format == ConversionFormat.AAC || format == ConversionFormat.MP3
}

class ConverterViewModel(private val deps: AppDependencies) : ViewModel() {
    private val _state = MutableStateFlow(ConverterUiState())
    val state: StateFlow<ConverterUiState> = _state.asStateFlow()
    val tier: StateFlow<Tier> = deps.entitlements.tier.stateIn(viewModelScope, SharingStarted.Eagerly, Tier.FREE)
    val history = deps.conversions.observe().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    private val _premiumPrompt = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val premiumPrompt: SharedFlow<Unit> = _premiumPrompt
    private var job: Job? = null

    init {
        viewModelScope.launch {
            val s = deps.settings.settings.first()
            val t = deps.entitlements.tier.first()
            _state.update {
                it.copy(
                    format = s.defaultFormat.takeIf { f -> FeatureGate.canUseFormat(t, f) && deps.converter.isAvailable(f) } ?: ConversionFormat.M4A,
                    quality = s.defaultQuality.takeIf { q -> FeatureGate.canUseQuality(t, q) } ?: FeatureGate.FREE_MAX_QUALITY,
                )
            }
        }
    }

    fun isAvailable(format: ConversionFormat) = deps.converter.isAvailable(format)

    fun select(uri: Uri) {
        _state.update { it.copy(probing = true, source = uri, probe = null, result = null, error = null, progress = 0f) }
        viewModelScope.launch {
            runCatching { deps.converter.probe(uri) }
                .onSuccess { p ->
                    _state.update {
                        val fmt = if (!p.hasVideo && it.format == ConversionFormat.MP4) ConversionFormat.M4A else it.format
                        it.copy(probing = false, probe = p, outputName = FileNames.withoutExtension(p.displayName), format = fmt)
                    }
                }
                .onFailure { e -> _state.update { it.copy(probing = false, source = null, error = e.message) } }
        }
    }

    fun setFormat(format: ConversionFormat) {
        if (!deps.converter.isAvailable(format)) return
        if (!FeatureGate.canUseFormat(tier.value, format)) { _premiumPrompt.tryEmit(Unit); return }
        _state.update { it.copy(format = format, result = null) }
    }

    fun setQuality(q: AudioQuality) {
        if (!FeatureGate.canUseQuality(tier.value, q)) { _premiumPrompt.tryEmit(Unit); return }
        _state.update { it.copy(quality = q, result = null) }
    }

    fun setOutputName(name: String) = _state.update { it.copy(outputName = name) }

    fun convert() {
        val s = _state.value
        val source = s.source ?: return
        val probe = s.probe ?: return
        if (!FeatureGate.canConvertDuration(tier.value, probe.durationMs)) { _premiumPrompt.tryEmit(Unit); return }
        job = viewModelScope.launch {
            val folder = deps.settings.settings.first().customFolderUri
            _state.update { it.copy(running = true, progress = 0f, error = null, result = null) }
            val record = ConversionRecord(
                sourceName = probe.displayName, outputName = "${s.outputName}.${s.format.extension}", outputUri = null,
                format = s.format, qualityKbps = if (s.qualityApplies) s.quality.kbps else null,
                status = ConversionStatus.RUNNING, errorMessage = null, createdAt = System.currentTimeMillis(),
            )
            val id = deps.conversions.insert(record)
            try {
                val out = deps.converter.convert(
                    ConversionRequest(source, probe, s.format, s.quality, s.outputName.ifBlank { "convertido" }, folder),
                ) { p -> _state.update { it.copy(progress = p) } }
                deps.conversions.update(record.copy(id = id, outputName = out.displayName, outputUri = out.uri.toString(), status = ConversionStatus.COMPLETED))
                _state.update { it.copy(running = false, progress = 1f, result = out) }
            } catch (e: CancellationException) {
                withContext(NonCancellable) { deps.conversions.update(record.copy(id = id, status = ConversionStatus.CANCELLED)) }
                _state.update { it.copy(running = false, progress = 0f) }
                throw e
            } catch (e: Exception) {
                deps.conversions.update(record.copy(id = id, status = ConversionStatus.FAILED, errorMessage = e.message))
                _state.update { it.copy(running = false, error = e.message ?: "La conversión falló") }
            }
        }
    }

    fun cancel() { job?.cancel(); job = null }
    fun reset() = _state.update { ConverterUiState(format = it.format, quality = it.quality) }
    fun clearHistory() = viewModelScope.launch { deps.conversions.clear() }
}
