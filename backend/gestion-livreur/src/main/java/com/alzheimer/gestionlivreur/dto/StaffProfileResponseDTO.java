package com.alzheimer.gestionlivreur.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffProfileResponseDTO {
    private Long id;
    private String username;
    private String fullName;
    private String phone;
    private Boolean active;
}
