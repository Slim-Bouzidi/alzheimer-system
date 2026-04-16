import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { supportNetworkHttpHeaders } from '../core/support-network-headers';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Skill } from '../models/skill.model';

const BASE = (environment as { supportNetworkApiUrl?: string }).supportNetworkApiUrl ?? '/api';

@Injectable({ providedIn: 'root' })
export class SkillService {
  private readonly baseUrl = `${BASE}/skills`;

  constructor(private http: HttpClient) {}

  getAllSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(this.baseUrl, { headers: supportNetworkHttpHeaders() });
  }
}
