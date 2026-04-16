    package com.alzheimer.supportnetwork.controller;

    import com.alzheimer.supportnetwork.dto.AvailabilityCreateDto;
    import com.alzheimer.supportnetwork.entity.AvailabilitySlot;
    import com.alzheimer.supportnetwork.service.AvailabilityService;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;

    @RestController
    @RequestMapping("/api/availability")
    @CrossOrigin(origins = "*")
    public class AvailabilityController {

        private final AvailabilityService service;

        public AvailabilityController(AvailabilityService service) {
            this.service = service;
        }

        @PostMapping
        public AvailabilitySlot create(@RequestBody AvailabilityCreateDto dto) {
            return service.create(dto);
        }

        @GetMapping("/member/{memberId}")
        public List<AvailabilitySlot> getByMember(@PathVariable Long memberId) {
            return service.getByMember(memberId);
        }

        @PutMapping("/{id}")
        public AvailabilitySlot update(@PathVariable Long id, @RequestBody AvailabilityCreateDto dto) {
            return service.update(id, dto);
        }

        @DeleteMapping("/{id}")
        public void delete(@PathVariable Long id) {
            service.delete(id);
        }
    }
