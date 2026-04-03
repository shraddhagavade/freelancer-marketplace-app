package com.example.freelancer.repository;
import com.example.freelancer.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface PaymentRepository extends JpaRepository<Payment, UUID> { }
