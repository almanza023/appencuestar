
import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService, AuthUser } from '@/app/core/services/auth.service';
import { UsuarioService } from '@/app/pages/service/usuario.service';

@Component({
    selector: 'app-mi-perfil',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, CardModule, InputTextModule, PasswordModule, ButtonModule, ProgressBarModule, MessageModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12 lg:col-span-5">
                <p-card header="Mi Perfil" subheader="Informacion del usuario autenticado">
                    <div class="flex flex-col gap-4">
                        <div>
                            <label class="block font-medium mb-2">Nombres</label>
                            <input pInputText class="w-full" [value]="nombres()" readonly />
                        </div>

                        <div>
                            <label class="block font-medium mb-2">Numero de documento</label>
                            <input pInputText class="w-full" [value]="numeroDocumento()" readonly />
                        </div>

                        <div>
                            <label class="block font-medium mb-2">Correo</label>
                            <input pInputText class="w-full" [value]="correo()" readonly />
                        </div>

                        <div>
                            <label class="block font-medium mb-2">Firma cargada</label>
                            <span
                                class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                                [ngClass]="firmaCargadaLabel() === 'Si' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'"
                            >
                                {{ firmaCargadaLabel() }}
                            </span>
                        </div>

                        <div class="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                            <div class="flex items-center justify-between gap-2 mb-3">
                                <label class="block font-medium">Firma (imagen)</label>
                                @if (firmaPreviewUrl()) {
                                    <button pButton type="button" class="p-button-sm p-button-text p-button-danger" label="Quitar" (click)="clearFirmaSelection()"></button>
                                }
                            </div>

                            <input #firmaInput type="file" accept="image/*" capture="camera" class="hidden" (change)="onFirmaSelected($event)" />

                            <div class="flex flex-wrap items-center gap-2 mb-3">
                                <button pButton type="button" class="p-button-sm" label="Seleccionar imagen" icon="pi pi-image" (click)="firmaInput.click()"></button>
                                <button pButton type="button" class="p-button-sm" severity="secondary" [disabled]="!firmaFile() || savingFirma()" label="Guardar firma" icon="pi pi-upload" (click)="saveFirma()"></button>
                            </div>

                            @if (firmaPreviewUrl()) {
                                <div class="rounded border border-surface-200 dark:border-surface-700 p-2 inline-block bg-white">
                                    <img [src]="firmaPreviewUrl()" alt="Vista previa de firma" class="max-h-40 max-w-full object-contain" />
                                </div>
                            } @else {
                                <small class="text-surface-500 dark:text-surface-400">No hay firma cargada.</small>
                            }
                        </div>
                    </div>
                </p-card>
            </div>

            <div class="col-span-12 lg:col-span-7">
                <p-card header="Cambiar clave" subheader="Debes ingresar tu clave actual y confirmar la nueva clave">
                    <form [formGroup]="passwordForm" (ngSubmit)="submitChangePassword()" class="flex flex-col gap-4">
                        <div>
                            <label for="claveAnterior" class="block font-medium mb-2">Clave anterior</label>
                            <p-password id="claveAnterior" formControlName="clave_anterior" [toggleMask]="true" [feedback]="false" styleClass="w-full" inputStyleClass="w-full" placeholder="Ingresa tu clave actual"></p-password>
                            @if (hasError('clave_anterior', 'required')) {
                                <p-message severity="error" text="La clave anterior es obligatoria." styleClass="mt-2"></p-message>
                            }
                        </div>

                        <div>
                            <label for="nuevaClave" class="block font-medium mb-2">Nueva clave</label>
                            <p-password id="nuevaClave" formControlName="nueva_clave" [toggleMask]="true" [feedback]="false" styleClass="w-full" inputStyleClass="w-full" placeholder="Minimo 8 caracteres"></p-password>

                            <div class="mt-3 mb-2">
                                <div class="text-sm mb-2">Seguridad de clave: {{ passwordStrengthLabel() }}</div>
                                <p-progressbar [value]="passwordStrengthValue()" [showValue]="false" styleClass="h-2"></p-progressbar>
                            </div>

                            @if (hasError('nueva_clave', 'required')) {
                                <p-message severity="error" text="La nueva clave es obligatoria." styleClass="mt-2"></p-message>
                            }
                            @if (hasError('nueva_clave', 'minlength')) {
                                <p-message severity="error" text="La nueva clave debe tener minimo 8 caracteres." styleClass="mt-2"></p-message>
                            }
                        </div>

                        <div>
                            <label for="confirmacionClave" class="block font-medium mb-2">Confirmacion de nueva clave</label>
                            <p-password id="confirmacionClave" formControlName="nueva_clave_confirmation" [toggleMask]="true" [feedback]="false" styleClass="w-full" inputStyleClass="w-full" placeholder="Repite la nueva clave"></p-password>

                            @if (hasError('nueva_clave_confirmation', 'required')) {
                                <p-message severity="error" text="La confirmacion es obligatoria." styleClass="mt-2"></p-message>
                            }
                            @if (passwordForm.touched && passwordForm.hasError('passwordMismatch')) {
                                <p-message severity="error" text="La confirmacion no coincide con la nueva clave." styleClass="mt-2"></p-message>
                            }
                        </div>

                        <div class="flex justify-end">
                            <p-button type="submit" label="Actualizar clave" icon="pi pi-check" [loading]="saving()"></p-button>
                        </div>
                    </form>
                </p-card>
            </div>
        </div>
    `
})
export class MiPerfil {
    private readonly fb = new FormBuilder();

    protected readonly saving = signal(false);
    protected readonly savingFirma = signal(false);
    private readonly user = signal<AuthUser | null>(null);
    protected readonly firmaPreviewUrl = signal('');
    protected readonly firmaFile = signal<File | null>(null);

    protected readonly passwordForm = this.fb.group(
        {
            clave_anterior: ['', [Validators.required]],
            nueva_clave: ['', [Validators.required, Validators.minLength(8)]],
            nueva_clave_confirmation: ['', [Validators.required]]
        },
        {
            validators: [this.matchPasswordsValidator('nueva_clave', 'nueva_clave_confirmation')]
        }
    );

    protected readonly passwordStrengthValue = computed(() => this.computePasswordStrength(this.passwordForm.controls.nueva_clave.value ?? ''));
    protected readonly passwordStrengthLabel = computed(() => this.getStrengthLabel(this.passwordStrengthValue()));

    constructor(
        private authService: AuthService,
        private usuarioService: UsuarioService,
        private messageService: MessageService
    ) {
        this.user.set(this.authService.getCurrentUser());
        this.firmaPreviewUrl.set(this.getUserString(['firma_url', 'firma', 'firma_imagen', 'firma_image', 'url_firma']) || '');
        this.authService.syncCurrentUser().subscribe({
            next: (user) => {
                this.user.set(user);
                if (!this.firmaFile()) {
                    this.firmaPreviewUrl.set(this.getUserString(['firma_url', 'firma', 'firma_imagen', 'firma_image', 'url_firma']) || '');
                }
            },
            error: () => {
                // No bloquear pantalla si falla refresco de perfil.
            }
        });
    }

    protected nombres = computed(() => this.getUserString(['nombres', 'nombre_completo', 'name', 'usuario']) || 'No disponible');
    protected numeroDocumento = computed(() => this.getUserString(['numero_documento', 'documento', 'usuario', 'username']) || 'No disponible');
    protected correo = computed(() => this.getUserString(['correo', 'email']) || 'No disponible');
    protected firmaCargadaLabel = computed(() => this.getFirmaCargadaLabel());

    protected hasError(controlName: 'clave_anterior' | 'nueva_clave' | 'nueva_clave_confirmation', errorKey: string): boolean {
        const control = this.passwordForm.controls[controlName];
        return !!control && control.touched && control.hasError(errorKey);
    }

    protected submitChangePassword(): void {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        this.authService.changePassword(this.passwordForm.getRawValue() as { clave_anterior: string; nueva_clave: string; nueva_clave_confirmation: string }).subscribe({
            next: () => {
                this.saving.set(false);
                this.passwordForm.reset();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exito',
                    detail: 'La clave fue actualizada correctamente.',
                    life: 3500
                });
            },
            error: (err) => {
                this.saving.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.extractErrorMessage(err),
                    life: 5000
                });
            }
        });
    }

    protected onFirmaSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.messageService.add({ severity: 'warn', summary: 'Validacion', detail: 'Solo se permiten imagenes.', life: 3500 });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            this.messageService.add({ severity: 'warn', summary: 'Validacion', detail: 'La imagen no debe superar 2 MB.', life: 3500 });
            return;
        }

        this.firmaFile.set(file);
        this.firmaPreviewUrl.set(URL.createObjectURL(file));
        input.value = '';
    }

    protected clearFirmaSelection(): void {
        this.firmaFile.set(null);
        this.firmaPreviewUrl.set(this.getUserString(['firma_url', 'firma', 'firma_imagen', 'firma_image', 'url_firma']) || '');
    }

    protected saveFirma(): void {
        const userId = this.getUserId();
        const file = this.firmaFile();
        if (!userId || !file) {
            return;
        }

        this.savingFirma.set(true);
        this.usuarioService.uploadFirma(userId, file).subscribe({
            next: (usuario) => {
                this.savingFirma.set(false);

                const userActual = this.user() ?? {};
                const userActualizado: AuthUser = {
                    ...userActual,
                    ...usuario,
                    firma_cargada: (usuario as { firma_cargada?: boolean | number | string | null }).firma_cargada ?? true
                };
                this.user.set(userActualizado);
                this.authService.updateStoredUser(userActualizado);

                this.firmaFile.set(null);
                this.firmaPreviewUrl.set(this.getUserString(['firma_url', 'firma', 'firma_imagen', 'firma_image', 'url_firma']) || '');

                this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Firma actualizada correctamente.', life: 3500 });
            },
            error: (err) => {
                this.savingFirma.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(err), life: 5000 });
            }
        });
    }

    private matchPasswordsValidator(newPasswordKey: string, confirmationKey: string): ValidatorFn {
        return (group): ValidationErrors | null => {
            const newPassword = group.get(newPasswordKey)?.value;
            const confirmation = group.get(confirmationKey)?.value;
            if (!newPassword || !confirmation) {
                return null;
            }

            return newPassword === confirmation ? null : { passwordMismatch: true };
        };
    }

    private getUserString(keys: string[]): string {
        const user = this.user();
        if (!user) {
            return '';
        }

        for (const key of keys) {
            const value = user[key];
            if (typeof value === 'string' && value.trim()) {
                return value;
            }
        }

        return '';
    }

    private getUserId(): number | null {
        const user = this.user();
        if (!user) {
            return null;
        }

        const candidates = ['id', 'usuario_id', 'user_id'];
        for (const key of candidates) {
            const value = user[key];
            if (typeof value === 'number') {
                return value;
            }
            if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
                return Number(value);
            }
        }

        return null;
    }

    private getFirmaCargadaLabel(): string {
        const user = this.user();
        if (!user) {
            return 'No';
        }

        const raw = user['firma_cargada'];
        if (typeof raw === 'string') {
            const normalized = raw.trim().toUpperCase();
            if (normalized === 'SI') {
                return 'Si';
            }
            if (normalized === 'NO') {
                return 'No';
            }
        }

        if (typeof raw === 'boolean') {
            return raw ? 'Si' : 'No';
        }

        if (typeof raw === 'number') {
            return raw === 1 ? 'Si' : 'No';
        }

        const hasFirma = !!this.getUserString(['firma_url', 'firma', 'firma_imagen', 'firma_image', 'url_firma']);
        return hasFirma ? 'Si' : 'No';
    }

    private computePasswordStrength(password: string): number {
        if (!password) {
            return 0;
        }

        let score = 0;
        if (password.length >= 8) score += 20;
        if (password.length >= 12) score += 20;
        if (/[a-z]/.test(password)) score += 15;
        if (/[A-Z]/.test(password)) score += 15;
        if (/\d/.test(password)) score += 15;
        if (/[^A-Za-z0-9]/.test(password)) score += 15;

        return Math.min(score, 100);
    }

    private getStrengthLabel(score: number): string {
        if (score >= 85) return 'Muy fuerte';
        if (score >= 65) return 'Fuerte';
        if (score >= 45) return 'Media';
        if (score >= 25) return 'Debil';
        if (score > 0) return 'Muy debil';
        return 'Sin evaluar';
    }

    private extractErrorMessage(err: unknown): string {
        const fallback = 'No se pudo actualizar la clave.';
        if (!err || typeof err !== 'object') {
            return fallback;
        }

        const errorObj = err as { error?: { message?: string; errors?: Record<string, string[] | string> } };
        if (errorObj.error?.message) {
            return errorObj.error.message;
        }

        const errors = errorObj.error?.errors;
        if (errors) {
            const firstKey = Object.keys(errors)[0];
            const firstValue = errors[firstKey];
            if (Array.isArray(firstValue) && firstValue.length > 0) {
                return firstValue[0];
            }
            if (typeof firstValue === 'string' && firstValue) {
                return firstValue;
            }
        }

        return fallback;
    }
}
