package com.freelancerhub.marketplace.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time schema cleanup that runs on startup.
 *
 * When new values were added to the Payment.status and Notification.type enums
 * (e.g. PENDING_PAYMENT, NEW_MESSAGE), Hibernate's ddl-auto=update does NOT alter
 * the CHECK constraints Postgres generated for the original enum values, so inserts
 * with the new values fail. The entity columns are now mapped as VARCHAR, but the
 * stale constraints still exist on databases that were created earlier.
 *
 * This drops those stale constraints if present. It is idempotent and safe to run
 * on every boot (DROP ... IF EXISTS). Harmless on fresh databases.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class SchemaFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        dropConstraint("payments", "payments_status_check");
        dropConstraint("notifications", "notifications_type_check");
    }

    private void dropConstraint(String table, String constraint) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + table + " DROP CONSTRAINT IF EXISTS " + constraint);
            log.info("Schema fix: ensured constraint {} on {} is dropped", constraint, table);
        } catch (Exception e) {
            // Never block startup over this cleanup
            log.warn("Schema fix: could not drop constraint {} on {}: {}", constraint, table, e.getMessage());
        }
    }
}
