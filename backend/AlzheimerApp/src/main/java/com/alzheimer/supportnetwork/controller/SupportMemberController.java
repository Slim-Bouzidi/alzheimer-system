package com.alzheimer.supportnetwork.controller;

import com.alzheimer.supportnetwork.dto.member.SupportMemberDto;
import com.alzheimer.supportnetwork.service.SupportMemberService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/members")
@CrossOrigin(origins = "http://localhost:4200")
public class SupportMemberController {
    private static final Logger log = LoggerFactory.getLogger(SupportMemberController.class);

    private final SupportMemberService supportMemberService;

    public SupportMemberController(SupportMemberService supportMemberService) {
        this.supportMemberService = supportMemberService;
    }

    @PostMapping
    public SupportMemberDto create(@Valid @RequestBody SupportMemberDto body) {
        log.info("Incoming request: POST /api/members");
        return supportMemberService.create(body);
    }

    @GetMapping
    public List<SupportMemberDto> getAll() {
        log.info("Incoming request: GET /api/members");
        return supportMemberService.findAllWithSkills();
    }

    @GetMapping("/{id}")
    public SupportMemberDto getById(@PathVariable Long id) {
        log.info("Incoming request: GET /api/members/{}", id);
        return supportMemberService.getById(id);
    }

    @PutMapping("/{id}")
    public SupportMemberDto update(@PathVariable Long id, @Valid @RequestBody SupportMemberDto body) {
        log.info("Incoming request: PUT /api/members/{}", id);
        return supportMemberService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        log.info("Incoming request: DELETE /api/members/{}", id);
        supportMemberService.delete(id);
    }
}
