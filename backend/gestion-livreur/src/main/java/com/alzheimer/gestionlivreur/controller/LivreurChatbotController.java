package com.alzheimer.gestionlivreur.controller;

import com.alzheimer.gestionlivreur.dto.ChatbotAskRequestDTO;
import com.alzheimer.gestionlivreur.dto.ChatbotAskResponseDTO;
import com.alzheimer.gestionlivreur.dto.ChatbotQuestionDTO;
import com.alzheimer.gestionlivreur.service.interfaces.ILivreurChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/livreur-chatbot")
@RequiredArgsConstructor
public class LivreurChatbotController {

    private final ILivreurChatbotService chatbotService;

    @GetMapping("/questions")
    public ResponseEntity<List<ChatbotQuestionDTO>> getPredefinedQuestions() {
        return ResponseEntity.ok(chatbotService.getPredefinedQuestions());
    }

    @PostMapping("/ask")
    public ResponseEntity<ChatbotAskResponseDTO> askPredefinedQuestion(@RequestBody ChatbotAskRequestDTO request) {
        return ResponseEntity.ok(chatbotService.askPredefinedQuestion(request));
    }
}
