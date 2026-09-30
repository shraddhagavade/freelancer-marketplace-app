package com.freelancerhub.marketplace.controller;

import com.freelancerhub.marketplace.dto.PortfolioItemDto;
import com.freelancerhub.marketplace.service.PortfolioService;
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
public class PortfolioController {

    private final PortfolioService portfolioService;

    // PUBLIC: a freelancer's portfolio (by USER id)
    @GetMapping("/freelancers/{userId}/portfolio")
    public ResponseEntity<List<PortfolioItemDto>> getPortfolio(@PathVariable Long userId) {
        return ResponseEntity.ok(portfolioService.getPortfolio(userId));
    }

    // FREELANCER: add an item to my portfolio
    @PostMapping("/portfolio")
    public ResponseEntity<PortfolioItemDto> add(Authentication auth, @Valid @RequestBody PortfolioItemDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolioService.addItem(auth.getName(), dto));
    }

    // FREELANCER: update my item
    @PutMapping("/portfolio/{id}")
    public ResponseEntity<PortfolioItemDto> update(@PathVariable Long id, Authentication auth, @Valid @RequestBody PortfolioItemDto dto) {
        return ResponseEntity.ok(portfolioService.updateItem(auth.getName(), id, dto));
    }

    // FREELANCER: delete my item
    @DeleteMapping("/portfolio/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        portfolioService.deleteItem(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
