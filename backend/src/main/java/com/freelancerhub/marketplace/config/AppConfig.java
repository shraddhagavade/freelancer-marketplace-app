package com.freelancerhub.marketplace.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class AppConfig {

    /** Simple RestClient used for outbound calls to PayPal. */
    @Bean
    public RestClient restClient() {
        return RestClient.builder().build();
    }
}
