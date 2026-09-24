package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Talks to the PayPal REST API v2 (sandbox) to create and capture orders.
 * Reuses the pattern from the standalone paypal-provider-service:
 *   - OAuth client_credentials with HTTP Basic auth to get an access token
 *   - POST /v2/checkout/orders (intent=CAPTURE) to create an order
 *   - POST /v2/checkout/orders/{id}/capture to capture an approved order
 */
@Service
@Slf4j
public class PayPalService {

    private final RestClient restClient;

    @Value("${paypal.enabled:false}")
    private boolean enabled;

    @Value("${paypal.client-id:}")
    private String clientId;

    @Value("${paypal.client-secret:}")
    private String clientSecret;

    @Value("${paypal.oauth-url}")
    private String oauthUrl;

    @Value("${paypal.create-order-url}")
    private String createOrderUrl;

    @Value("${paypal.capture-order-url}")
    private String captureOrderUrl;

    @Value("${paypal.currency:USD}")
    private String currency;

    public PayPalService(RestClient restClient) {
        this.restClient = restClient;
    }

    public boolean isEnabled() {
        return enabled && !clientId.isBlank() && !clientSecret.isBlank();
    }

    /** Fetch a fresh OAuth access token (no caching - simple and always valid). */
    private String getAccessToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");

        try {
            Map<String, Object> resp = restClient.post()
                    .uri(oauthUrl)
                    .headers(h -> {
                        h.setBasicAuth(clientId, clientSecret);
                        h.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                    })
                    .body(form)
                    .retrieve()
                    .body(Map.class);

            if (resp == null || resp.get("access_token") == null) {
                throw new BadRequestException("Failed to obtain PayPal access token");
            }
            return (String) resp.get("access_token");
        } catch (Exception e) {
            log.error("PayPal token error", e);
            throw new BadRequestException("PayPal authentication failed: " + e.getMessage());
        }
    }

    /**
     * Create an order for the given amount. Returns the PayPal order id and the
     * approval URL the buyer must be redirected to.
     */
    public CreatedOrder createOrder(String amount, String returnUrl, String cancelUrl) {
        String token = getAccessToken();

        Map<String, Object> amountObj = Map.of(
                "currency_code", currency,
                "value", amount
        );
        Map<String, Object> purchaseUnit = Map.of("amount", amountObj);
        Map<String, Object> experienceContext = Map.of(
                "payment_method_preference", "IMMEDIATE_PAYMENT_REQUIRED",
                "landing_page", "LOGIN",
                "shipping_preference", "NO_SHIPPING",
                "user_action", "PAY_NOW",
                "return_url", returnUrl,
                "cancel_url", cancelUrl
        );
        Map<String, Object> paymentSource = Map.of(
                "paypal", Map.of("experience_context", experienceContext)
        );
        Map<String, Object> body = Map.of(
                "intent", "CAPTURE",
                "payment_source", paymentSource,
                "purchase_units", List.of(purchaseUnit)
        );

        try {
            Map<String, Object> resp = restClient.post()
                    .uri(createOrderUrl)
                    .headers(h -> {
                        h.setBearerAuth(token);
                        h.setContentType(MediaType.APPLICATION_JSON);
                        h.add("PayPal-Request-Id", UUID.randomUUID().toString());
                    })
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (resp == null || resp.get("id") == null) {
                throw new BadRequestException("PayPal did not return an order id");
            }

            String orderId = (String) resp.get("id");
            String approvalUrl = extractApprovalUrl(resp);
            return new CreatedOrder(orderId, approvalUrl);
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("PayPal create order error", e);
            throw new BadRequestException("Failed to create PayPal order: " + e.getMessage());
        }
    }

    /** Capture an approved order. Returns the PayPal status (e.g. COMPLETED). */
    public String captureOrder(String orderId) {
        String token = getAccessToken();
        String url = captureOrderUrl.replace("{orderId}", orderId);

        try {
            Map<String, Object> resp = restClient.post()
                    .uri(url)
                    .headers(h -> {
                        h.setBearerAuth(token);
                        h.setContentType(MediaType.APPLICATION_JSON);
                        h.add("PayPal-Request-Id", UUID.randomUUID().toString());
                    })
                    .body("{}")
                    .retrieve()
                    .body(Map.class);

            if (resp == null || resp.get("status") == null) {
                throw new BadRequestException("PayPal capture returned no status");
            }
            return (String) resp.get("status");
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("PayPal capture error", e);
            throw new BadRequestException("Failed to capture PayPal order: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String extractApprovalUrl(Map<String, Object> resp) {
        Object linksObj = resp.get("links");
        if (linksObj instanceof List<?> links) {
            // Prefer the "payer-action" link (newer flow), fall back to "approve"
            String payerAction = null;
            String approve = null;
            for (Object l : links) {
                if (l instanceof Map<?, ?> link) {
                    Object rel = link.get("rel");
                    Object href = link.get("href");
                    if ("payer-action".equals(rel)) payerAction = (String) href;
                    if ("approve".equals(rel)) approve = (String) href;
                }
            }
            return payerAction != null ? payerAction : approve;
        }
        return null;
    }

    /** Small holder for a created order. */
    public record CreatedOrder(String orderId, String approvalUrl) {}
}
