import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, MessageModule, AppFloatingConfigurator],
    styles: [
        `
            .login-shell {
                min-height: 100vh;
                background:
                    radial-gradient(circle at 15% 15%, rgba(120, 214, 25, 0.18) 0%, rgba(120, 214, 25, 0) 36%),
                    radial-gradient(circle at 85% 10%, rgba(6, 94, 38, 0.2) 0%, rgba(6, 94, 38, 0) 42%),
                    linear-gradient(160deg, #f4f6f8 0%, #e5eaee 42%, #f8faf9 100%);
            }

            .login-frame {
                width: min(100%, 33rem);
                border-radius: 28px;
                border: 1px solid #d4dde4;
                background: rgba(255, 255, 255, 0.95);
                box-shadow: 0 22px 50px rgba(21, 33, 45, 0.18);
                backdrop-filter: blur(4px);
                overflow: hidden;
            }

            .login-brand {
                background: linear-gradient(130deg, #0f5130 0%, #17663d 42%, #79d117 100%);
                color: #ffffff;
                padding: 1.4rem 1.4rem 1.6rem;
            }

            .brand-logo-wrap {
                width: 100%;
                border-radius: 16px;
                background: #ffffff;
                padding: 0.5rem;
                box-shadow: inset 0 0 0 1px #dce4ea;
            }

            .brand-logo {
                width: 100%;
                max-height: 6.2rem;
                object-fit: contain;
                display: block;
                margin: 0 auto;
            }

            .brand-app-name {
                margin: 0.9rem 0 0.2rem;
                font-size: clamp(1.55rem, 4vw, 2rem);
                font-weight: 800;
                letter-spacing: 0.02em;
                text-align: center;
            }

            .brand-description {
                margin: 0;
                opacity: 0.93;
                text-align: center;
                font-size: 0.9rem;
            }

            .login-form-zone {
                padding: 1.4rem 1.25rem 1.6rem;
            }

            .field-label {
                display: block;
                color: #0f172a;
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 0.45rem;
            }

            @media (min-width: 640px) {
                .login-brand {
                    padding: 1.7rem 1.9rem 1.8rem;
                }

                .login-form-zone {
                    padding: 1.8rem 1.9rem 1.9rem;
                }

                .field-label {
                    font-size: 1.02rem;
                }
            }
        `
    ],
    template: `
        <app-floating-configurator />
        <div class="login-shell flex items-center justify-center px-3 py-4 sm:px-4">
            <div class="login-frame">
                <div class="login-brand">
                    <div class="brand-logo-wrap">
                        <img class="brand-logo" src="/images/logo.jpeg" alt="Logo principal" />
                    </div>
                    <h1 class="brand-app-name">EncuestAR</h1>
                    <p class="brand-description">Plataforma de gestion de encuestas y proyectos territoriales</p>
                </div>

                <div class="login-form-zone">
                    <div class="text-center mb-4">
                        <div class="text-surface-900 text-2xl sm:text-3xl font-medium mb-2">Bienvenido</div>
                        <span class="text-color-secondary font-medium">Inicia sesion para continuar</span>
                    </div>

                    <form (ngSubmit)="submitLogin()">
                        <label for="usuario1" class="field-label">Usuario </label>
                        <input
                            pInputText
                            id="usuario1"
                            type="text"
                            inputmode="numeric"
                            autocomplete="username"
                            placeholder="Ejemplo: 1234567890"
                            class="w-full mb-3"
                            [(ngModel)]="usuario"
                            name="usuario"
                            (input)="onUsuarioInput()"
                        />

                        <label for="password1" class="field-label">Contraseña</label>
                        <p-password id="password1" [(ngModel)]="password" name="password" placeholder="Ingresa tu contrasena" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                        @if (errorMessage) {
                            <p-message severity="error" [text]="errorMessage" styleClass="w-full mb-4"></p-message>
                        }

                        <p-button type="submit" label="Iniciar sesion" styleClass="w-full" [loading]="loading"></p-button>
                    </form>
                </div>
            </div>
        </div>
    `
})
export class Login {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    usuario: string = '';

    password: string = '';

    loading = false;

    errorMessage = '';

    ngOnInit(): void {
        if (this.authService.isAuthenticated()) {
            this.router.navigate(['/']);
        }
    }

    onUsuarioInput(): void {
        this.usuario = this.usuario.replace(/\D/g, '');
    }

    submitLogin(): void {
        this.errorMessage = '';

        if (!this.usuario || !this.password) {
            this.errorMessage = 'Usuario y contrasena son obligatorios.';
            return;
        }

        if (!/^\d+$/.test(this.usuario)) {
            this.errorMessage = 'El usuario debe ser numerico.';
            return;
        }

        this.loading = true;
        this.authService.login(this.usuario, this.password).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/']);
            },
            error: () => {
                this.loading = false;
                this.errorMessage = 'Credenciales invalidas o servicio no disponible.';
            }
        });
    }
}
