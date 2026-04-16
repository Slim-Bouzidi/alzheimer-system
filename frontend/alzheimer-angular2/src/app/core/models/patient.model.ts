export interface Patient {
  id: number;
  patientCode: string;
  firstName: string;
  lastName: string;
  age?: number;
  latitude?: number;
  longitude?: number;
}
