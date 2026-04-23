package com.alzheimer.gestionlivreur.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatbotAskResponseDTO {
    private String questionKey;
    private String questionLabel;
    private String answer;
    private String generatedAt;
}
