package com.example.freelancer.service;

import com.example.freelancer.domain.User;
import com.example.freelancer.exception.BadRequestException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetEmailService {
    private final JavaMailSender mailSender;
    private final String mailHost;
    private final String fromAddress;

    public PasswordResetEmailService(JavaMailSender mailSender,
                                     @Value("${spring.mail.host:}") String mailHost,
                                     @Value("${app.mail.from:no-reply@freelancer-marketplace.local}") String fromAddress) {
        this.mailSender = mailSender;
        this.mailHost = mailHost;
        this.fromAddress = fromAddress;
    }

    public void sendPasswordResetEmail(User user, String resetUrl) {
        if (mailHost == null || mailHost.isBlank()) {
            throw new BadRequestException("Password reset email is not configured yet. Please set MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM, and APP_BASE_URL on the server.");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(user.getEmail());
            helper.setFrom(fromAddress);
            helper.setSubject("Reset your Freelancer Marketplace password");
            helper.setText("""
                    Hello %s,

                    We received a request to reset your Freelancer Marketplace password.

                    Open this secure link to choose a new password:
                    %s

                    This link will expire in 15 minutes and can only be used once.

                    If you did not request this change, you can safely ignore this email.
                    """.formatted(user.getFullName(), resetUrl));
            mailSender.send(message);
        } catch (MessagingException | MailAuthenticationException ex) {
            throw new IllegalStateException("Password reset email could not be prepared or authenticated");
        } catch (MailException ex) {
            throw new IllegalStateException("Password reset email could not be sent");
        }
    }
}
