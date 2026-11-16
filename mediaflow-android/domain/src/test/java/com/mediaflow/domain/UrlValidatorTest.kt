package com.mediaflow.domain

import com.mediaflow.domain.util.UrlValidation
import com.mediaflow.domain.util.UrlValidator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class UrlValidatorTest {
    @Test fun acceptsHttpsLinkInsideSharedText() {
        val r = UrlValidator.validate("Mira esto: https://www.youtube.com/watch?v=abc123 ¡genial!")
        assertTrue(r is UrlValidation.Valid)
        assertEquals("youtube.com", (r as UrlValidation.Valid).host)
    }
    @Test fun addsSchemeToBareDomain() {
        assertTrue(UrlValidator.validate("youtu.be/abc") is UrlValidation.Valid)
    }
    @Test fun rejectsHttp() { assertTrue(UrlValidator.validate("http://example.com/a.mp4") is UrlValidation.Invalid) }
    @Test fun rejectsCredentials() { assertTrue(UrlValidator.validate("https://user:pass@example.com/") is UrlValidation.Invalid) }
    @Test fun rejectsPrivateHosts() {
        assertTrue(UrlValidator.validate("https://192.168.1.10/file.mp4") is UrlValidation.Invalid)
        assertTrue(UrlValidator.validate("https://localhost/file.mp4") is UrlValidation.Invalid)
    }
    @Test fun rejectsGarbage() { assertTrue(UrlValidator.validate("hola mundo") is UrlValidation.Invalid) }
}
