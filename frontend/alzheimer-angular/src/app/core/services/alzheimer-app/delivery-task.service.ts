import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DeliveryStatus,
  DeliveryTask,
  DeliveryTaskCreateRequest,
  DeliveryTaskUpdateRequest,
} from '../core/models/delivery-task.model';

@Injectable({ providedIn: 'root' })
export class DeliveryTaskService {
  private readonly baseUrl =
    'http://localhost:8082/patient-service/api/delivery-tasks';

  constructor(private http: HttpClient) { }

  getAll(): Observable<DeliveryTask[]> {
    return this.http.get<DeliveryTask[]>(this.baseUrl);
  }

  getById(id: number): Observable<DeliveryTask> {
    return this.http.get<DeliveryTask>(`${this.baseUrl}/${id}`);
  }

  getByDate(date: string): Observable<DeliveryTask[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<DeliveryTask[]>(`${this.baseUrl}/date`, { params });
  }

  getByDateAndStatus(
    date: string,
    status: DeliveryStatus
  ): Observable<DeliveryTask[]> {
    const params = new HttpParams()
      .set('date', date)
      .set('status', status);
    return this.http.get<DeliveryTask[]>(`${this.baseUrl}/status`, { params });
  }

  getByPatient(patientCode: string): Observable<DeliveryTask[]> {
    return this.http.get<DeliveryTask[]>(
      `${this.baseUrl}/patient/${patientCode}`
    );
  }

  getByStaff(username: string): Observable<DeliveryTask[]> {
    return this.http.get<DeliveryTask[]>(`${this.baseUrl}/staff/${username}`);
  }

  create(payload: DeliveryTaskCreateRequest): Observable<DeliveryTask> {
    return this.http.post<DeliveryTask>(this.baseUrl, payload);
  }

  update(
    id: number,
    payload: DeliveryTaskUpdateRequest
  ): Observable<DeliveryTask> {
    return this.http.put<DeliveryTask>(`${this.baseUrl}/${id}`, payload);
  }

  confirm(id: number): Observable<DeliveryTask> {
    return this.http.put<DeliveryTask>(`${this.baseUrl}/${id}/confirm`, {});
  }

  markDelivered(id: number): Observable<DeliveryTask> {
    return this.http.put<DeliveryTask>(`${this.baseUrl}/${id}/delivered`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}


