import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

interface WorkspaceAction {
  label: string;
  route: string;
}

interface WorkspaceContent {
  icon: string;
  subtitle: string;
  highlights: string[];
  actions: WorkspaceAction[];
}

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, SidebarComponent],
  templateUrl: './placeholder.component.html',
  styleUrls: ['./placeholder.component.css']
})
export class PlaceholderComponent {
  title = 'Page';
  backLink = '/';
  sidebarRole = 'PATIENT';
  workspace: WorkspaceContent = {
    icon: 'pi-compass',
    subtitle: 'Cet espace est disponible dans votre session sécurisée.',
    highlights: [],
    actions: []
  };

  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    const data = this.route.snapshot.data;
    this.title = data['title'] ?? 'Page';
    this.backLink = data['backLink'] ?? this.authService.getHomeRoute();
    this.sidebarRole = this.authService.getPrimaryRole() ?? 'PATIENT';
    this.workspace = this.buildWorkspace(this.route.snapshot.routeConfig?.path ?? '');
  }

  goBack(): void {
    void this.router.navigateByUrl(this.backLink);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  private buildWorkspace(path: string): WorkspaceContent {
    const viewByPath: Record<string, WorkspaceContent> = {
      'patient-appointments': {
        icon: 'pi-calendar',
        subtitle: 'Retrouvez vos prochains rendez-vous, la préparation demandée et les contacts utiles.',
        highlights: ['Prochain contrôle médical et rappels automatiques', 'Préparation avant consultation', 'Accès rapide au tableau de bord patient'],
        actions: [
          { label: 'Retour au tableau patient', route: '/patient-dashboard' },
          { label: 'Voir le suivi cognitif', route: '/cognitive-dashboard' }
        ]
      },
      'patient-medications': {
        icon: 'pi-heart',
        subtitle: 'Centralisez les traitements du jour, les doses prévues et les points de vigilance.',
        highlights: ['Résumé quotidien des traitements', 'Rappels de prise prioritaires', 'Vue synthétique pour le patient et les proches'],
        actions: [
          { label: 'Retour au tableau patient', route: '/patient-dashboard' },
          { label: 'Ouvrir les rendez-vous', route: '/patient-appointments' }
        ]
      },
      'patient-exercises': {
        icon: 'pi-bolt',
        subtitle: 'Accédez aux exercices cognitifs et suivez votre progression dans un espace dédié.',
        highlights: ['Exercices adaptés au profil patient', 'Progression cognitive visible', 'Lien direct avec le suivi quotidien'],
        actions: [
          { label: 'Ouvrir le dashboard cognitif', route: '/cognitive-dashboard' },
          { label: 'Retour au tableau patient', route: '/patient-dashboard' }
        ]
      },
      'patient-emergency': {
        icon: 'pi-bell',
        subtitle: 'Cet espace regroupe les réflexes d\'urgence, les contacts et les actions rapides.',
        highlights: ['SOS et contacts prioritaires', 'Procédure d\'alerte simplifiée', 'Retour immédiat au tableau patient'],
        actions: [
          { label: 'Retour au tableau patient', route: '/patient-dashboard' },
          { label: 'Voir les rendez-vous', route: '/patient-appointments' }
        ]
      },
      'caregiver-dashboard': {
        icon: 'pi-users',
        subtitle: 'L\'aidant dispose ici d\'une vue coordonnée sur les patients, les rendez-vous et les ressources.',
        highlights: ['Suivi des patients accompagnés', 'Planning partagé avec l\'équipe', 'Accès rapide aux ressources pratiques'],
        actions: [
          { label: 'Mes patients', route: '/caregiver-patients' },
          { label: 'Mon planning', route: '/caregiver-appointments' }
        ]
      },
      'caregiver-patients': {
        icon: 'pi-id-card',
        subtitle: 'Visualisez les patients suivis, leurs priorités et les points d\'attention à transmettre.',
        highlights: ['Liste des patients suivis', 'Accès rapide aux alertes et rendez-vous', 'Synthèse claire pour l\'aidant'],
        actions: [
          { label: 'Retour au tableau aidant', route: '/caregiver-dashboard' },
          { label: 'Voir les rapports', route: '/caregiver-reports' }
        ]
      },
      'caregiver-appointments': {
        icon: 'pi-calendar-clock',
        subtitle: 'Suivez les rendez-vous à venir et l\'organisation logistique associée.',
        highlights: ['Calendrier simplifié', 'Préparation des visites médicales', 'Vision claire des échéances'],
        actions: [
          { label: 'Retour au tableau aidant', route: '/caregiver-dashboard' },
          { label: 'Mes patients', route: '/caregiver-patients' }
        ]
      },
      'caregiver-reports': {
        icon: 'pi-file',
        subtitle: 'Consultez les rapports utiles à l\'accompagnement quotidien et à la coordination familiale.',
        highlights: ['Rapports de suivi accessibles', 'Informations médicales vulgarisées', 'Transmission plus fluide avec les équipes'],
        actions: [
          { label: 'Retour au tableau aidant', route: '/caregiver-dashboard' },
          { label: 'Voir les ressources', route: '/caregiver-resources' }
        ]
      },
      'caregiver-resources': {
        icon: 'pi-book',
        subtitle: 'Rassemblez les fiches pratiques, conseils et contenus utiles aux aidants.',
        highlights: ['Guides pratiques', 'Ressources de prévention', 'Accès rapide à l\'espace aidant'],
        actions: [
          { label: 'Retour au tableau aidant', route: '/caregiver-dashboard' },
          { label: 'Voir les rapports', route: '/caregiver-reports' }
        ]
      },
      'admin-dashboard': {
        icon: 'pi-th-large',
        subtitle: 'Pilotez les rôles, les utilisateurs et les accès depuis un point de contrôle sécurisé.',
        highlights: ['Vue d\'ensemble administration', 'Accès rapide à la gestion des utilisateurs', 'Contrôle des espaces sécurisés par rôle'],
        actions: [
          { label: 'Gestion des utilisateurs', route: '/admin-users' },
          { label: 'Paramètres système', route: '/admin-settings' }
        ]
      },
      'admin-users': {
        icon: 'pi-users',
        subtitle: 'Administrez les comptes, vérifiez les rôles Keycloak et gardez une vue claire sur les accès.',
        highlights: ['Utilisateurs et rôles', 'Contrôle d\'accès cohérent', 'Lien avec les microservices sécurisés'],
        actions: [
          { label: 'Retour au tableau admin', route: '/admin-dashboard' },
          { label: 'Paramètres système', route: '/admin-settings' }
        ]
      },
      'admin-settings': {
        icon: 'pi-cog',
        subtitle: 'Supervisez les réglages transverses de la plateforme et la cohérence des environnements.',
        highlights: ['Réglages système', 'Cohérence frontend/backend', 'Point d\'entrée pour l\'administration'],
        actions: [
          { label: 'Retour au tableau admin', route: '/admin-dashboard' },
          { label: 'Gestion des utilisateurs', route: '/admin-users' }
        ]
      }
    };

    return viewByPath[path] ?? {
      icon: 'pi-compass',
      subtitle: 'Cet espace est sécurisé par Keycloak et prêt à être utilisé depuis votre rôle actuel.',
      highlights: ['Navigation sécurisée', 'Session utilisateur active', 'Retour rapide vers l\'espace principal'],
      actions: [{ label: 'Retour à mon espace', route: this.authService.getHomeRoute() }]
    };
  }
}
