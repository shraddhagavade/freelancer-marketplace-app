package com.freelancerhub.marketplace.service;

import com.freelancerhub.marketplace.dto.CreateProposalRequest;
import com.freelancerhub.marketplace.dto.ProposalDto;
import com.freelancerhub.marketplace.entity.*;
import com.freelancerhub.marketplace.exception.BadRequestException;
import com.freelancerhub.marketplace.exception.DuplicateResourceException;
import com.freelancerhub.marketplace.exception.ResourceNotFoundException;
import com.freelancerhub.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;

    @Transactional
    public ProposalDto submitProposal(Long projectId, String freelancerEmail, CreateProposalRequest request) {
        User freelancer = userRepository.findByEmail(freelancerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", freelancerEmail));

        // Verify user is a FREELANCER
        boolean isFreelancer = freelancer.getRoles().stream()
                .anyMatch(r -> r.getName() == Role.RoleName.FREELANCER);
        if (!isFreelancer) {
            throw new BadRequestException("Only freelancers can submit proposals");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        // Project must be OPEN
        if (project.getStatus() != Project.ProjectStatus.OPEN) {
            throw new BadRequestException("Cannot submit proposals for a project that is not OPEN");
        }

        // Cannot propose on own project
        if (project.getClient().getId().equals(freelancer.getId())) {
            throw new BadRequestException("Cannot submit a proposal on your own project");
        }

        // No duplicate proposals
        if (proposalRepository.existsByProjectIdAndFreelancerId(projectId, freelancer.getId())) {
            throw new DuplicateResourceException("You have already submitted a proposal for this project");
        }

        Proposal proposal = Proposal.builder()
                .project(project)
                .freelancer(freelancer)
                .coverLetter(request.getCoverLetter())
                .proposedPrice(request.getProposedPrice())
                .estimatedDays(request.getEstimatedDays())
                .status(Proposal.ProposalStatus.SUBMITTED)
                .build();

        proposalRepository.save(proposal);

        // Update proposal count on project
        project.setProposalCount(proposalRepository.countByProjectId(projectId));
        projectRepository.save(project);

        log.info("Proposal submitted by {} for project '{}'", freelancerEmail, project.getTitle());
        return mapToDto(proposal);
    }

    public List<ProposalDto> getProposalsForProject(Long projectId, String clientEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        // Only the project owner can see all proposals
        if (!project.getClient().getEmail().equals(clientEmail)) {
            throw new BadRequestException("Only the project owner can view proposals");
        }

        return proposalRepository.findByProjectId(projectId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ProposalDto> getMyProposals(String freelancerEmail) {
        User freelancer = userRepository.findByEmail(freelancerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", freelancerEmail));

        return proposalRepository.findByFreelancerId(freelancer.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProposalDto acceptProposal(Long proposalId, String clientEmail) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", "id", proposalId));

        Project project = proposal.getProject();

        // Only project owner can accept
        if (!project.getClient().getEmail().equals(clientEmail)) {
            throw new BadRequestException("Only the project owner can accept proposals");
        }

        // Project must still be OPEN
        if (project.getStatus() != Project.ProjectStatus.OPEN) {
            throw new BadRequestException("Project is no longer accepting proposals");
        }

        // Accept this proposal
        proposal.setStatus(Proposal.ProposalStatus.ACCEPTED);
        proposalRepository.save(proposal);

        // Reject all other proposals for this project
        List<Proposal> otherProposals = proposalRepository.findByProjectId(project.getId());
        for (Proposal other : otherProposals) {
            if (!other.getId().equals(proposalId) && other.getStatus() == Proposal.ProposalStatus.SUBMITTED) {
                other.setStatus(Proposal.ProposalStatus.REJECTED);
                proposalRepository.save(other);
            }
        }

        // Move project to IN_PROGRESS
        project.setStatus(Project.ProjectStatus.IN_PROGRESS);
        projectRepository.save(project);

        log.info("Proposal {} accepted for project '{}'. Project now IN_PROGRESS.", proposalId, project.getTitle());
        return mapToDto(proposal);
    }

    @Transactional
    public ProposalDto rejectProposal(Long proposalId, String clientEmail) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", "id", proposalId));

        if (!proposal.getProject().getClient().getEmail().equals(clientEmail)) {
            throw new BadRequestException("Only the project owner can reject proposals");
        }

        proposal.setStatus(Proposal.ProposalStatus.REJECTED);
        proposalRepository.save(proposal);

        log.info("Proposal {} rejected", proposalId);
        return mapToDto(proposal);
    }

    @Transactional
    public ProposalDto withdrawProposal(Long proposalId, String freelancerEmail) {
        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal", "id", proposalId));

        if (!proposal.getFreelancer().getEmail().equals(freelancerEmail)) {
            throw new BadRequestException("You can only withdraw your own proposals");
        }

        if (proposal.getStatus() != Proposal.ProposalStatus.SUBMITTED) {
            throw new BadRequestException("Can only withdraw proposals that are in SUBMITTED status");
        }

        proposal.setStatus(Proposal.ProposalStatus.WITHDRAWN);
        proposalRepository.save(proposal);

        // Update proposal count
        Project project = proposal.getProject();
        project.setProposalCount(proposalRepository.countByProjectId(project.getId()));
        projectRepository.save(project);

        log.info("Proposal {} withdrawn by {}", proposalId, freelancerEmail);
        return mapToDto(proposal);
    }

    private ProposalDto mapToDto(Proposal proposal) {
        User freelancer = proposal.getFreelancer();
        FreelancerProfile profile = freelancerProfileRepository.findByUserId(freelancer.getId()).orElse(null);

        return ProposalDto.builder()
                .id(proposal.getId())
                .projectId(proposal.getProject().getId())
                .projectTitle(proposal.getProject().getTitle())
                .freelancerId(freelancer.getId())
                .freelancerName(freelancer.getFirstName() + " " + freelancer.getLastName())
                .freelancerTitle(profile != null ? profile.getTitle() : null)
                .freelancerAvatarUrl(freelancer.getAvatarUrl())
                .freelancerRating(profile != null ? profile.getAverageRating() : null)
                .coverLetter(proposal.getCoverLetter())
                .proposedPrice(proposal.getProposedPrice())
                .estimatedDays(proposal.getEstimatedDays())
                .status(proposal.getStatus().name())
                .createdAt(proposal.getCreatedAt())
                .build();
    }
}
