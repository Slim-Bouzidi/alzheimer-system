import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestPageComponent } from './test-page/test-page.component';
import { DoctorDashboardSimpleComponent } from './doctor/doctor-dashboard-simple.component';
import { DoctorSettingsComponent } from './doctor/doctor-settings.component';
import { DoctorReportsComponent } from './doctor/doctor-reports.component';
import { DoctorReportCreateComponent } from './doctor/doctor-report-create.component';
import { DoctorPatientsComponent } from './doctor/doctor-patients.component';
import { DoctorAppointmentsComponent } from './doctor/doctor-appointments.component';
import { DoctorArticlesComponent } from './doctor/doctor-articles.component';
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
import { LivreurDashboardComponent } from './livreur/livreur-dashboard.component';
import { LivreurLayoutComponent } from './livreur/livreur-layout.component';
import { PlaceholderComponent } from './shared/placeholder/placeholder.component';
import { DeliveryTaskListComponent } from './features/delivery-tasks/delivery-task-list/delivery-task-list.component';
import { StaffListComponent } from './features/staff/staff-list/staff-list.component';
import { AssignmentListComponent } from './features/assignments/assignment-list/assignment-list.component';
import { ShiftListComponent } from './features/shifts/shift-list/shift-list.component';
import { MealSlotListComponent } from './features/logistics/meal-slots/meal-slot-list.component';
import { RouteListComponent } from './features/logistics/routes/route-list.component';
import { RouteMapComponent } from './features/logistics/route-map/route-map.component';

const routes: Routes = [
  { path: '', redirectTo: '/test', pathMatch: 'full' },
  { path: 'test', component: TestPageComponent },
  { path: 'soignant-dashboard', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantDashboardComponent }] },
  { path: 'soignant-patients', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantPatientsPageComponent }] },
  { path: 'soignant-rapports', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantRapportsPageComponent }] },
  { path: 'soignant-rappels-medicaments', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantRappelsMedicamentsPageComponent }] },
  { path: 'soignant-rappels-repas', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantRappelsRepasPageComponent }] },
  { path: 'soignant-rappels-rendez-vous', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantRappelsRendezVousPageComponent }] },
  { path: 'soignant-suivi', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantSuiviPageComponent }] },
  { path: 'soignant-agenda', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantAgendaPageComponent }] },
  { path: 'soignant-rapports-hebdo', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantRapportsHebdoPageComponent }] },
  { path: 'soignant-fiche-transmission/:patientId', component: SoignantLayoutComponent, children: [{ path: '', component: FicheTransmissionHebdoComponent }] },
  { path: 'soignant-notifications', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantNotificationsPageComponent }] },
  { path: 'soignant-parametres', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantParametresPageComponent }] },
  { path: 'soignant-profil', component: SoignantLayoutComponent, children: [{ path: '', component: SoignantProfilPageComponent }] },
  { path: 'doctor-dashboard', component: DoctorDashboardSimpleComponent },
  { path: 'doctor-settings', component: DoctorSettingsComponent },
  { path: 'doctor-reports', component: DoctorReportsComponent },
  { path: 'doctor-report-create', component: DoctorReportCreateComponent },
  { path: 'doctor-patients', component: DoctorPatientsComponent },
  { path: 'doctor-appointments', component: DoctorAppointmentsComponent },
  { path: 'medical-agenda', component: MedicalAgendaComponent },
  { path: 'patient-dashboard', component: PatientDashboardComponent },
  { path: 'livreur-dashboard', component: LivreurDashboardComponent },
  {
    path: '',
    component: LivreurLayoutComponent,
    children: [
      { path: 'delivery-tasks', component: DeliveryTaskListComponent },
      { path: 'my-tasks', component: DeliveryTaskListComponent },
      { path: 'staff', component: StaffListComponent },
      { path: 'assignments', component: AssignmentListComponent },
      { path: 'shifts', component: ShiftListComponent },
      { path: 'meal-slots', component: MealSlotListComponent },
      { path: 'routes', component: RouteListComponent },
      { path: 'map/:routeId', component: RouteMapComponent },
    ]
  },
  { path: 'appointments', component: DeliveryTaskListComponent },
  { path: 'patient-appointments', component: PlaceholderComponent, data: { title: 'Rendez-vous', backLink: '/patient-dashboard' } },
  { path: 'patient-medications', component: PlaceholderComponent, data: { title: 'Médicaments', backLink: '/patient-dashboard' } },
  { path: 'patient-exercises', component: PlaceholderComponent, data: { title: 'Exercices', backLink: '/patient-dashboard' } },
  { path: 'patient-emergency', component: PlaceholderComponent, data: { title: 'Urgences', backLink: '/patient-dashboard' } },
  { path: 'caregiver-dashboard', component: PlaceholderComponent, data: { title: 'Tableau de bord Aidant', backLink: '/test' } },
  { path: 'caregiver-patients', component: PlaceholderComponent, data: { title: 'Mes Patients', backLink: '/test' } },
  { path: 'caregiver-appointments', component: PlaceholderComponent, data: { title: 'Planning', backLink: '/test' } },
  { path: 'caregiver-reports', component: PlaceholderComponent, data: { title: 'Rapports', backLink: '/test' } },
  { path: 'caregiver-resources', component: PlaceholderComponent, data: { title: 'Ressources', backLink: '/test' } },
  { path: 'admin-dashboard', component: PlaceholderComponent, data: { title: 'Vue d\'ensemble', backLink: '/test' } },
  { path: 'admin-users', component: PlaceholderComponent, data: { title: 'Utilisateurs', backLink: '/test' } },
  { path: 'admin-settings', component: PlaceholderComponent, data: { title: 'Système', backLink: '/test' } },
  { path: 'doctor-articles', component: DoctorArticlesComponent },
  { path: '**', redirectTo: '/test' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
