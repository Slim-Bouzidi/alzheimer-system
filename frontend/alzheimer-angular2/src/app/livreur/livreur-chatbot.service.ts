import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatbotQuestion {
  key: string;
  label: string;
}

export interface ChatbotAskResponse {
  questionKey: string;
  questionLabel: string;
  answer: string;
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LivreurChatbotService {
  private readonly baseUrl = 'http://localhost:8082/patient-service/api/livreur-chatbot';

  constructor(private readonly http: HttpClient) {}

  getPredefinedQuestions(): Observable<ChatbotQuestion[]> {
    return this.http.get<ChatbotQuestion[]>(`${this.baseUrl}/questions`);
  }

  askQuestion(questionKey: string, staffUsername?: string): Observable<ChatbotAskResponse> {
    return this.http.post<ChatbotAskResponse>(`${this.baseUrl}/ask`, {
      questionKey,
      staffUsername: staffUsername ?? null
    });
  }
}
