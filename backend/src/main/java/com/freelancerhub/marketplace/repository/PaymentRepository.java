package com.freelancerhub.marketplace.repository;

import com.freelancerhub.marketplace.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByProjectId(Long projectId);

    List<Payment> findByClientId(Long clientId);

    List<Payment> findByFreelancerId(Long freelancerId);
}
