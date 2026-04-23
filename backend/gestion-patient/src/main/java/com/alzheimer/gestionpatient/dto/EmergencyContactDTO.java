package com.alzheimer.gestionpatient.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyContactDTO {
    private String fullName;
    private String relationship;
    private String phone;
    private String email;
    private Integer patientId;
}
