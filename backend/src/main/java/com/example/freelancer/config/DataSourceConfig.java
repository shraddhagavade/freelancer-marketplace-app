package com.example.freelancer.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {
    @Bean
    @Primary
    DataSource dataSource(Environment environment) {
        String dbUrl = environment.getProperty("DB_URL");
        String username = environment.getProperty("DB_USERNAME", "freelancer");
        String password = environment.getProperty("DB_PASSWORD", "freelancer");
        String jdbcUrl;

        if (dbUrl != null && !dbUrl.isBlank()) {
            ParsedDatabaseUrl parsedDatabaseUrl = parseDatabaseUrl(dbUrl);
            jdbcUrl = parsedDatabaseUrl.jdbcUrl();
            if (isBlank(environment.getProperty("DB_USERNAME")) && parsedDatabaseUrl.username() != null) {
                username = parsedDatabaseUrl.username();
            }
            if (isBlank(environment.getProperty("DB_PASSWORD")) && parsedDatabaseUrl.password() != null) {
                password = parsedDatabaseUrl.password();
            }
        } else {
            String host = environment.getProperty("DB_HOST", "localhost");
            String port = environment.getProperty("DB_PORT", "5432");
            String database = environment.getProperty("DB_NAME", "freelancer_db");
            jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + database;
        }

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setJdbcUrl(jdbcUrl);
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        return dataSource;
    }

    private ParsedDatabaseUrl parseDatabaseUrl(String dbUrl) {
        if (dbUrl.startsWith("jdbc:postgresql://")) {
            return new ParsedDatabaseUrl(dbUrl, null, null);
        }

        URI uri = URI.create(dbUrl);
        String userInfo = uri.getUserInfo();
        String username = null;
        String password = null;
        if (userInfo != null && !userInfo.isBlank()) {
            String[] credentials = userInfo.split(":", 2);
            username = credentials[0];
            password = credentials.length > 1 ? credentials[1] : null;
        }

        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String database = uri.getPath() == null ? "" : uri.getPath().replaceFirst("^/", "");
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + "/" + database;
        return new ParsedDatabaseUrl(jdbcUrl, username, password);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record ParsedDatabaseUrl(String jdbcUrl, String username, String password) {
    }
}
