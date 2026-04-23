import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import {
  ChatbotAskResponse,
  ChatbotQuestion,
  LivreurChatbotService
} from './livreur-chatbot.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-livreur-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './livreur-layout.component.html',
  styleUrls: ['./livreur-layout.component.css']
})
export class LivreurLayoutComponent {
  chatbotOpen = false;
  isLoading = false;
  errorMessage = '';

  questions: ChatbotQuestion[] = [];
  messages: { from: 'user' | 'bot'; text: string; time: Date }[] = [
    {
      from: 'bot',
      text: 'Bonjour. Choisissez une question operationnelle ci-dessous et je vous reponds avec les donnees du systeme.',
      time: new Date()
    }
  ];

  constructor(
    private router: Router,
    private readonly chatbotService: LivreurChatbotService,
    private readonly authService: AuthService
  ) {
    this.loadQuestions();
  }

  get livreurName(): string {
    return this.authService.getDisplayName(false);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  toggleChatbot(): void {
    this.chatbotOpen = !this.chatbotOpen;
  }

  askPredefinedQuestion(question: ChatbotQuestion): void {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.messages.push({ from: 'user', text: question.label, time: new Date() });
    this.isLoading = true;

    this.chatbotService.askQuestion(question.key).subscribe({
      next: (response: ChatbotAskResponse) => {
        this.messages.push({ from: 'bot', text: response.answer, time: new Date() });
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.status === 404
            ? 'Endpoint chatbot introuvable (404). Redemarrez gestion-livreur pour charger les nouveaux endpoints.'
            : 'Erreur de connexion au chatbot. Verifiez que gestion-livreur est demarre.';
        this.isLoading = false;
      }
    });
  }

  private loadQuestions(): void {
    this.chatbotService.getPredefinedQuestions().subscribe({
      next: (questions: ChatbotQuestion[]) => {
        this.questions = questions;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.status === 404
            ? 'Questions chatbot introuvables (404). Redemarrez gestion-livreur pour charger les nouveaux endpoints.'
            : 'Impossible de charger les questions predefinies.';
      }
    });
  }
}
