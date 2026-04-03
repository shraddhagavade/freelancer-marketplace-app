package com.example.freelancer.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private final int requestsPerMinute;
    private final Map<String, Window> counters = new ConcurrentHashMap<>();

    public RateLimitFilter(@Value("${app.rate-limit.requests-per-minute}") int requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        long now = Instant.now().getEpochSecond();
        Window w = counters.computeIfAbsent(ip, key -> new Window(now, 0));
        synchronized (w) {
            if (now - w.windowStartEpochSec >= 60) {
                w.windowStartEpochSec = now;
                w.count = 0;
            }
            if (w.count >= requestsPerMinute) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Rate limit exceeded");
                return;
            }
            w.count++;
        }
        filterChain.doFilter(request, response);
    }

    private static class Window {
        long windowStartEpochSec;
        int count;

        Window(long windowStartEpochSec, int count) {
            this.windowStartEpochSec = windowStartEpochSec;
            this.count = count;
        }
    }
}
