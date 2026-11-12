package com.socialhub.email.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Email service for sending verification and password reset emails
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    /**
     * Send email verification link
     */
    public void sendVerificationEmail(String email, String token) {
        try {
            String verificationUrl = frontendBaseUrl + "/verify-email?token=" + token;

            Context context = new Context();
            context.setVariable("email", email);
            context.setVariable("verificationUrl", verificationUrl);
            context.setVariable("expiryHours", 24);

            String htmlContent = templateEngine.process("emails/verify-email", context);

            sendHtmlEmail(email, "SocialHub - Xác minh email", htmlContent);
            log.info("Verification email sent to {}", email);

        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", email, e.getMessage());
            throw new RuntimeException("Email sending failed", e);
        }
    }

    /**
     * Send password reset link
     */
    public void sendPasswordResetEmail(String email, String token) {
        try {
            String resetUrl = frontendBaseUrl + "/reset-password?token=" + token;

            Context context = new Context();
            context.setVariable("email", email);
            context.setVariable("resetUrl", resetUrl);
            context.setVariable("expiryMinutes", 30);

            String htmlContent = templateEngine.process("emails/reset-password", context);

            sendHtmlEmail(email, "SocialHub - Đặt lại mật khẩu", htmlContent);
            log.info("Password reset email sent to {}", email);

        } catch (Exception e) {
            log.error("Failed to send reset email to {}: {}", email, e.getMessage());
            throw new RuntimeException("Email sending failed", e);
        }
    }

    /**
     * Send HTML email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(mailFrom);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    /**
     * Send simple text email (fallback)
     */
    public void sendSimpleEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
        log.info("Simple email sent to {}", to);
    }
}
