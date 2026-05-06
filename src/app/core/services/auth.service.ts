import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** IDs de roles con acceso restringido (solo pueden ver sus propias encuestas).
 *  Ajusta este arreglo según los IDs reales de tu tabla de roles. */
export const ROLES_RESTRINGIDOS: number[] = [2];

export interface AuthUser {
    [key: string]: unknown;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: AuthUser;
}

export interface ChangePasswordPayload {
    clave_anterior: string;
    nueva_clave: string;
    nueva_clave_confirmation: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly authStorageKey = 'auth';
    private readonly tokenStorageKey = 'token';
    private readonly sessionStartKey = 'session_start';
    private readonly sessionDurationMs = 3 * 60 * 60 * 1000; // 3 horas
    private readonly apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    login(usuario: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { usuario, password }).pipe(
            switchMap((loginResponse) =>
                this.getMe(loginResponse.access_token).pipe(
                    map((user) => ({ ...loginResponse, user })),
                    catchError(() => of(loginResponse))
                )
            ),
            tap((response) => this.saveSession(response))
        );
    }

    getMe(token?: string): Observable<AuthUser> {
        const bearer = token ?? this.getToken();
        const headers = new HttpHeaders({
            Authorization: bearer ? `Bearer ${bearer}` : '',
            'Content-Type': 'application/json'
        });

        return this.http.get<AuthUser>(`${this.apiUrl}/me`, { headers });
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenStorageKey);
    }

    getCurrentUser(): AuthUser | null {
        const authRaw = localStorage.getItem(this.authStorageKey);
        if (!authRaw) {
            return null;
        }

        try {
            const parsed = JSON.parse(authRaw) as LoginResponse;
            return parsed?.user ?? null;
        } catch {
            return null;
        }
    }

    getCurrentUserId(): number | null {
        const user = this.getCurrentUser();
        if (!user) return null;
        const id = Number(user['id']);
        return isNaN(id) ? null : id;
    }

    getCurrentUserRolId(): number | null {
        const user = this.getCurrentUser();
        if (!user) return null;
        const rolId = Number(user['rol_id']);
        return isNaN(rolId) ? null : rolId;
    }

    isRolRestringido(): boolean {
        const rolId = this.getCurrentUserRolId();
        return rolId !== null && ROLES_RESTRINGIDOS.includes(rolId);
    }

    syncCurrentUser(): Observable<AuthUser> {
        return this.getMe().pipe(
            tap((user) => {
                this.updateStoredUser(user);
            })
        );
    }

    updateStoredUser(user: AuthUser): void {
        const authRaw = localStorage.getItem(this.authStorageKey);
        if (!authRaw) {
            return;
        }

        try {
            const parsed = JSON.parse(authRaw) as LoginResponse;
            const merged: LoginResponse = { ...parsed, user };
            localStorage.setItem(this.authStorageKey, JSON.stringify(merged));
        } catch {
            // Ignorar payload de sesion corrupto.
        }
    }

    changePassword(payload: ChangePasswordPayload): Observable<unknown> {
        const bearer = this.getToken();
        const headers = new HttpHeaders({
            Authorization: bearer ? `Bearer ${bearer}` : '',
            'Content-Type': 'application/json'
        });

        return this.http.post(`${this.apiUrl}/change-password`, payload, { headers });
    }

    saveSession(response: LoginResponse): void {
        localStorage.setItem(this.authStorageKey, JSON.stringify(response));
        localStorage.setItem(this.tokenStorageKey, response.access_token);
        localStorage.setItem(this.sessionStartKey, Date.now().toString());
    }

    isSessionExpired(): boolean {
        const startRaw = localStorage.getItem(this.sessionStartKey);
        if (!startRaw) return true;
        const start = Number(startRaw);
        if (isNaN(start)) return true;
        return Date.now() - start > this.sessionDurationMs;
    }

    logout(): void {
        localStorage.clear();
    }
}
