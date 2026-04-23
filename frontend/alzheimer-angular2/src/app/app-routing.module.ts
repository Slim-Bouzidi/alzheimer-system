import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoctorDashboardSimpleComponent } from './doctor/doctor-dashboard-simple.component';
import { DoctorSettingsComponent } from './doctor/doctor-settings.component';
import { DoctorReportsComponent } from './doctor/doctor-reports.component';
import { DoctorReportCreateComponent } from './doctor/doctor-report-create.component';
import { DoctorPatientsComponent } from './doctor/doctor-patients.component';
import { DoctorAppointmentsComponent } from './doctor/doctor-appointments.component';
import { DoctorAlertsComponent } from './doctor/doctor-alerts.component';
import { DoctorArticlesComponent } from './doctor/doctor-articles.component';
import { DoctorLayoutComponent } from './doctor/doctor-layout.component';
import { MedicalAgendaComponent } from './doctor/medical-agenda.component';
import { PatientDashboardComponent } from './patient/patient-dashboard.component';
import { SoignantLayoutComponent } from './soignant/soignant-layout.component';
import { SoignantDashboardComponent } from './soignant/soignant-dashboard.component';
import { SoignantPatientsPageComponent } from './soignant/pages/soignant-patients-page.component';
import { SoignantRapportsPageComponent } from './soignant/pages/soignant-rapports-page.component';
import { SoignantRappelsMedicamentsPageComponent } from './soignant/pages/soignant-rappels-medicaments-page.component';
import { SoignantRappelsRepasPageComponent } from './soignant/pages/soignant-rappels-repas-page.component';
import { SoignantRappelsRendezVousPageComponent } from './soignant/pages/soignant-rappels-rendez-vous-page.component';
import { SoignantSuiviPageComponent } from './soignant/pages/soignant-suivi-page.component';
import { SoignantAgendaPageComponent } from './soignant/pages/soignant-agenda-page.component';
import { SoignantRapportsHebdoPageComponent } from './soignant/pages/soignant-rapports-hebdo-page.component';
import { FicheTransmissionHebdoComponent } from './soignant/pages/fiche-transmission-hebdo.component';
import { SoignantNotificationsPageComponent } from './soignant/pages/soignant-notifications-page.component';
import { SoignantParametresPageComponent } from './soignant/pages/soignant-parametres-page.component';
import { SoignantProfilPageComponent } from './soignant/pages/soignant-profil-page.component';
import { NetworkMembersPageComponent } from './soignant/pages/network-members-page.component';
import { PatientNetworkPageComponent } from './soignant/pages/patient-network-page.component';
import { AvailabilitiesPageComponent } from './soignant/pages/availabilities-page.component';
import { MyMissionsPageComponent } from './soignant/pages/my-missions-page.component';
import { NetworkDashboardPageComponent } from './soignant/pages/network-dashboard-page.component';
import { LivreurDashboardComponent } from './livreur/livreur-dashboard.component';
import { LivreurLayoutComponent } from './livreur/livreur-layout.component';
import { PlaceholderComponent } from './shared/placeholder/placeholder.component';
import { RegistrationComponent } from './features/registration/registration.component';
import { ProfileComponent } from './features/profile/profile.component';
import { DeliveryTaskListComponent } from './features/delivery-tasks/delivery-task-list/delivery-task-list.component';
import { StaffListComponent } from './features/staff/staff-list/staff-list.component';
import { AssignmentListComponent } from './features/assignments/assignment-list/assignment-list.component';
import { ShiftListComponent } from './features/shifts/shift-list/shift-list.component';
import { MealSlotListComponent } from './features/logistics/meal-slots/meal-slot-list.component';
import { RouteListComponent } from './features/logistics/routes/route-list.component';
import { RouteMapComponent } from './features/logistics/route-map/route-map.component';
import { HomeRedirectComponent } from './core/home-redirect/home-redirect.component';
import { keycloakAuthChildGuard, keycloakAuthGuard } from './core/guards/keycloak-auth.guard';
import { roleGuard } from './core/guards/role.guard';

const ADMIN_ROLES = ['ADMIN'];
const DOCTOR_ROLES = ['ADMIN', 'DOCTOR'];
const CAREGIVER_ROLES = ['ADMIN', 'CAREGIVER'];
const SOIGNANT_ROLES = ['ADMIN', 'SOIGNANT'];
const LIVREUR_ROLES = ['ADMIN', 'LIVREUR'];
const PATIENT_ROLES = ['PATIENT'];
const SUPPORT_NETWORK_ROLES = ['ADMIN', 'CAREGIVER', 'SOIGNANT'];

const routes: Routes = [
  { path: '', component: HomeRedirectComponent, canActivate: [keycloakAuthGuard], pathMatch: 'full' },
  { path: 'register', component: RegistrationComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [keycloakAuthGuard] },
  { path: 'soignant-dashboard', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SUPPORT_NETWORK_ROLES }, children: [
    { path: '', component: SoignantDashboardComponent },
    { path: 'network/members', component: NetworkMembersPageComponent },
    { path: 'network/patient-network', component: PatientNetworkPageComponent },
    { path: 'network/availabilities', component: AvailabilitiesPageComponent },
    { path: 'network/missions', component: MyMissionsPageComponent },
    { path: 'network/dashboard', component: NetworkDashboardPageComponent }
  ] },
  { path: 'soignant-patients', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantPatientsPageComponent }] },
  { path: 'soignant-rapports', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantRapportsPageComponent }] },
  { path: 'soignant-rappels-medicaments', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantRappelsMedicamentsPageComponent }] },
  { path: 'soignant-rappels-repas', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantRappelsRepasPageComponent }] },
  { path: 'soignant-rappels-rendez-vous', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantRappelsRendezVousPageComponent }] },
  { path: 'soignant-suivi', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantSuiviPageComponent }] },
  { path: 'soignant-agenda', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantAgendaPageComponent }] },
  { path: 'soignant-rapports-hebdo', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantRapportsHebdoPageComponent }] },
  { path: 'soignant-fiche-transmission/:patientId', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: FicheTransmissionHebdoComponent }] },
  { path: 'soignant-notifications', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantNotificationsPageComponent }] },
  { path: 'soignant-parametres', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantParametresPageComponent }] },
  { path: 'soignant-profil', component: SoignantLayoutComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: SOIGNANT_ROLES }, children: [{ path: '', component: SoignantProfilPageComponent }] },
  { path: 'patient-dashboard', component: PatientDashboardComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: PATIENT_ROLES } },
  {
    path: '',
    component: DoctorLayoutComponent,
    canActivate: [keycloakAuthGuard, roleGuard],
    canActivateChild: [keycloakAuthChildGuard],
    data: { roles: DOCTOR_ROLES },
    children: [
      { path: 'doctor-dashboard', component: DoctorDashboardSimpleComponent, data: { pageTitle: 'Vue d\'ensemble', pageSubtitle: 'Synthese clinique et activite du jour.' } },
      { path: 'doctor-settings', component: DoctorSettingsComponent, data: { pageTitle: 'Parametres', pageSubtitle: 'Profil, notifications et securite du compte medecin.' } },
      { path: 'doctor-reports', component: DoctorReportsComponent, data: { pageTitle: 'Rapports medicaux', pageSubtitle: 'Suivi, partage et archivage des rapports cliniques.' } },
      { path: 'doctor-report-create', component: DoctorReportCreateComponent, data: { pageTitle: 'Nouveau rapport', pageSubtitle: 'Preparation structuree d\'un rapport de suivi.' } },
      { path: 'doctor-patients', component: DoctorPatientsComponent, data: { pageTitle: 'Patients', pageSubtitle: 'Gestion du portefeuille patient et dossiers associes.' } },
      { path: 'doctor-appointments', component: DoctorAppointmentsComponent, data: { pageTitle: 'Rendez-vous', pageSubtitle: 'Organisation des consultations et validations de planning.' } },
      { path: 'doctor-alerts', component: DoctorAlertsComponent, data: { pageTitle: 'Alertes', pageSubtitle: 'Evenements critiques et actions de suivi medical.' } },
      { path: 'doctor-articles', component: DoctorArticlesComponent, data: { pageTitle: 'Base de connaissances', pageSubtitle: 'Publication et gestion des articles medicaux.' } },
      { path: 'medical-agenda', component: MedicalAgendaComponent, data: { pageTitle: 'Agenda medical', pageSubtitle: 'Pilotage complet du calendrier clinique.' } },
      { path: 'clinical-reports', loadComponent: () => import('./features/clinical-reports/report-list/report-list.component').then(m => m.ReportListComponent), data: { pageTitle: 'Rapports cliniques', pageSubtitle: 'Liste et suivi des rapports cliniques.' } },
      { path: 'clinical-reports/new', loadComponent: () => import('./features/clinical-reports/clinical-form/clinical-form.component').then(m => m.ClinicalFormComponent), data: { pageTitle: 'Nouveau rapport clinique', pageSubtitle: 'Creation d\'un dossier clinique detaille.' } },
      { path: 'clinical-reports/edit/:id', loadComponent: () => import('./features/clinical-reports/clinical-form/clinical-form.component').then(m => m.ClinicalFormComponent), data: { pageTitle: 'Edition rapport clinique', pageSubtitle: 'Mise a jour du dossier clinique selectionne.' } },
    ]
  },
  {
    path: '',
    component: LivreurLayoutComponent,
    canActivate: [keycloakAuthGuard, roleGuard],
    canActivateChild: [keycloakAuthChildGuard],
    data: { roles: LIVREUR_ROLES },
    children: [
      { path: 'livreur-dashboard', component: LivreurDashboardComponent, canActivate: [roleGuard], data: { roles: LIVREUR_ROLES } },
      { path: 'delivery-tasks', component: DeliveryTaskListComponent, canActivate: [roleGuard], data: { roles: LIVREUR_ROLES } },
      { path: 'my-tasks', component: DeliveryTaskListComponent, canActivate: [roleGuard], data: { roles: LIVREUR_ROLES } },
      { path: 'staff', component: StaffListComponent, canActivate: [roleGuard], data: { roles: LIVREUR_ROLES } },
      { path: 'assignments', component: AssignmentListComponent, canActivate: [roleGuard], data: { roles: LIVREUR_ROLES } },
      { path: 'shifts', component: ShiftListComponent, canActivate: [roleGuard], data: { roles: LIVREUR_ROLES } },
      { path: 'meal-slots', component: MealSlotListComponent, canActivate: [roleGuard], data: { roles: LIVREUR_ROLES } },
      { path: 'routes', component: RouteListComponent, canActivate: [roleGuard], data: { roles: LIVREUR_ROLES } },
      { path: 'map/:routeId', component: RouteMapComponent, canActivate: [roleGuard], data: { roles: LIVREUR_ROLES } },
    ]
  },
  { path: 'appointments', component: DeliveryTaskListComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { roles: LIVREUR_ROLES } },
  { path: 'patient-appointments', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Rendez-vous', backLink: '/patient-dashboard', roles: PATIENT_ROLES } },
  { path: 'patient-medications', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Médicaments', backLink: '/patient-dashboard', roles: PATIENT_ROLES } },
  { path: 'patient-exercises', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Exercices', backLink: '/patient-dashboard', roles: PATIENT_ROLES } },
  { path: 'patient-emergency', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Urgences', backLink: '/patient-dashboard', roles: PATIENT_ROLES } },
  { path: 'caregiver-dashboard', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Tableau de bord Aidant', backLink: '/caregiver-dashboard', roles: CAREGIVER_ROLES } },
  { path: 'caregiver-patients', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Mes Patients', backLink: '/caregiver-dashboard', roles: CAREGIVER_ROLES } },
  { path: 'caregiver-appointments', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Planning', backLink: '/caregiver-dashboard', roles: CAREGIVER_ROLES } },
  { path: 'caregiver-reports', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Rapports', backLink: '/caregiver-dashboard', roles: CAREGIVER_ROLES } },
  { path: 'caregiver-resources', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Ressources', backLink: '/caregiver-dashboard', roles: CAREGIVER_ROLES } },
  { path: 'admin-dashboard', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Vue d\'ensemble', backLink: '/admin-dashboard', roles: ADMIN_ROLES } },
  { path: 'admin-users', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Utilisateurs', backLink: '/admin-dashboard', roles: ADMIN_ROLES } },
  { path: 'admin-settings', component: PlaceholderComponent, canActivate: [keycloakAuthGuard, roleGuard], data: { title: 'Système', backLink: '/admin-dashboard', roles: ADMIN_ROLES } },
  { path: 'cognitive-dashboard', canActivate: [keycloakAuthGuard, roleGuard], data: { roles: PATIENT_ROLES }, loadComponent: () => import('./features/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent) },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
