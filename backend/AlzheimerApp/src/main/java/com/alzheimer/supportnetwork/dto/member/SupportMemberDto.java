package com.alzheimer.supportnetwork.dto.member;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMemberDto {

    private Long id;
    private String fullName;
    private String phone;
    /** Optional — used for mission assignment emails. Empty string is allowed (same as unset). */
    @Pattern(
            regexp = "^$|^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            message = "Invalid email address")
    @Size(max = 320)
    private String email;
    private String type;
    private String locationZone;
    private Double latitude;
    private Double longitude;
    private String notes;
    private Double averageRating;
    private Integer totalRatings;
    @Builder.Default
    private List<String> skills = new ArrayList<>();
}
