package com.example.freelancer.repository;
import com.example.freelancer.domain.Payment;
import com.example.freelancer.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByPayer_EmailIgnoreCaseOrPayee_EmailIgnoreCaseOrderByCreatedAtDesc(String payerEmail, String payeeEmail);
    Optional<Payment> findTopByTaskOrderByCreatedAtDesc(Task task);
}
