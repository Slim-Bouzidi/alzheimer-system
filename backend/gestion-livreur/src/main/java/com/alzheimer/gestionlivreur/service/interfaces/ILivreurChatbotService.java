package com.alzheimer.gestionlivreur.service.interfaces;

import com.alzheimer.gestionlivreur.dto.ChatbotAskRequestDTO;
import com.alzheimer.gestionlivreur.dto.ChatbotAskResponseDTO;
import com.alzheimer.gestionlivreur.dto.ChatbotQuestionDTO;

import java.util.List;

public interface ILivreurChatbotService {
    List<ChatbotQuestionDTO> getPredefinedQuestions();
    ChatbotAskResponseDTO askPredefinedQuestion(ChatbotAskRequestDTO request);
}
