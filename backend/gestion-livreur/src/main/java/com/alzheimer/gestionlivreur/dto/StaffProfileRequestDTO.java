package com.alzheimer.gestionlivreur.dto;

import lombok.*;

import javax.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffProfileRequestDTO {

    @NotBlank
    private String username;

    @NotBlank
    private String fullName;

    private String phone;

    private Boolean active;
}
