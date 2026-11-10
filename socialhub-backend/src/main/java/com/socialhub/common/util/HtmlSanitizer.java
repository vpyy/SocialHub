package com.socialhub.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * HTML Sanitizer for XSS prevention
 * Removes dangerous HTML tags from user-generated content
 */
@Slf4j
@Component
public class HtmlSanitizer {

    // Patterns for dangerous tags and attributes
    private static final Pattern SCRIPT_TAG = Pattern.compile("<script[^>]*>.*?</script>", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    private static final Pattern IFRAME_TAG = Pattern.compile("<iframe[^>]*>.*?</iframe>", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    private static final Pattern OBJECT_TAG = Pattern.compile("<object[^>]*>.*?</object>", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    private static final Pattern EMBED_TAG = Pattern.compile("<embed[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern ON_EVENT = Pattern.compile("\\s*on\\w+\\s*=\\s*['\"]?[^'\"]*['\"]?", Pattern.CASE_INSENSITIVE);

    /**
     * Sanitize HTML content by removing dangerous tags
     */
    public String sanitize(String html) {
        if (html == null || html.isEmpty()) {
            return html;
        }

        String sanitized = html;

        // Remove script tags
        sanitized = SCRIPT_TAG.matcher(sanitized).replaceAll("");

        // Remove iframe tags
        sanitized = IFRAME_TAG.matcher(sanitized).replaceAll("");

        // Remove object tags
        sanitized = OBJECT_TAG.matcher(sanitized).replaceAll("");

        // Remove embed tags
        sanitized = EMBED_TAG.matcher(sanitized).replaceAll("");

        // Remove on* event handlers (onclick, onload, etc.)
        sanitized = ON_EVENT.matcher(sanitized).replaceAll("");

        log.debug("HTML content sanitized");
        return sanitized;
    }

    /**
     * Escape HTML special characters
     */
    public String escapeHtml(String text) {
        if (text == null) {
            return null;
        }

        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }
}
