package com.freelancerhub.marketplace.controller;

import com.freelancerhub.marketplace.dto.CreateProposalRequest;
import com.freelancerhub.marketplace.dto.ProposalDto;
import com.freelancerhub.marketplace.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    // ===== FREELANCER: Submit proposal =====
    @PostMapping("/projects/{projectId}/proposals")
    public ResponseEntity<ProposalDto> submitProposal(
            @PathVariable Long projectId,
            Authentication auth,
            @Valid @RequestBody CreateProposalRequest request) {
        ProposalDto proposal = proposalService.submitProposal(projectId, auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(proposal);
    }

    // ===== CLIENT: View proposals for their project =====
    @GetMapping("/projects/{projectId}/proposals")
    public ResponseEntity<List<ProposalDto>> getProjectProposals(
            @PathVariable Long projectId,
            Authentication auth) {
        return ResponseEntity.ok(proposalService.getProposalsForProject(projectId, auth.getName()));
    }

    // ===== FREELANCER: View my proposals =====
    @GetMapping("/proposals/my")
    public ResponseEntity<List<ProposalDto>> getMyProposals(Authentication auth) {
        return ResponseEntity.ok(proposalService.getMyProposals(auth.getName()));
    }

    // ===== CLIENT: Accept proposal =====
    @PostMapping("/proposals/{id}/accept")
    public ResponseEntity<ProposalDto> acceptProposal(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(proposalService.acceptProposal(id, auth.getName()));
    }

    // ===== CLIENT: Reject proposal =====
    @PostMapping("/proposals/{id}/reject")
    public ResponseEntity<ProposalDto> rejectProposal(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(proposalService.rejectProposal(id, auth.getName()));
    }

    // ===== FREELANCER: Withdraw proposal =====
    @PostMapping("/proposals/{id}/withdraw")
    public ResponseEntity<ProposalDto> withdrawProposal(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(proposalService.withdrawProposal(id, auth.getName()));
    }
}
