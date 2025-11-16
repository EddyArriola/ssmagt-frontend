import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
private apiUrl = `${environment.apiUrl}/auth/login`; // Cambia la URL según tu backend

  constructor(private http: HttpClient) { }
  
  login(cui: string, password: string) {
    return this.http.post<{ access_token: string }>(this.apiUrl, { cui, password });
  }
}
