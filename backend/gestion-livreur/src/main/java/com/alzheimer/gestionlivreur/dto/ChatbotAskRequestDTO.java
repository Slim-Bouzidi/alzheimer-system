package com.alzheimer.gestionlivreur.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotAskRequestDTO {
    private String questionKey;
    private String staffUsername;
}
