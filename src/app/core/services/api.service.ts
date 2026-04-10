import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    protected baseUrl = environment.apiUrl;

    constructor(protected http: HttpClient) {}

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        });
    }

    private getMultipartHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            Authorization: token ? `Bearer ${token}` : ''
        });
    }

    get<T>(endpoint: string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { headers: this.getHeaders() });
    }

    getById<T>(endpoint: string, id: number | string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${endpoint}/${id}`, { headers: this.getHeaders() });
    }

    post<T>(endpoint: string, body: object): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, { headers: this.getHeaders() });
    }

    put<T>(endpoint: string, id: number | string, body: object): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}/${endpoint}/${id}`, body, { headers: this.getHeaders() });
    }

    delete<T>(endpoint: string, id: number | string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}/${endpoint}/${id}`, { headers: this.getHeaders() });
    }

    postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, formData, { headers: this.getMultipartHeaders() });
    }

    putFormData<T>(endpoint: string, id: number | string, formData: FormData): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}/${id}?_method=PUT`, formData, { headers: this.getMultipartHeaders() });
    }
}
