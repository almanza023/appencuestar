import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Formulario, FormularioService } from '@/app/pages/service/formulario.service';

@Component({
    selector: 'app-formularios',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, TagModule, ToolbarModule, ToastModule, ConfirmDialogModule],
    template: `
        <p-toast />

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 shadow-sm">
                <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Formularios</span>
                <div class="text-4xl font-bold mt-2">{{ formularios().length }}</div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 shadow-sm">
                <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Borrador</span>
                <div class="text-4xl font-bold mt-2 text-yellow-600 dark:text-yellow-400">{{ totalPorEstado('borrador') }}</div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 shadow-sm">
                <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Revisión</span>
                <div class="text-4xl font-bold mt-2 text-blue-600 dark:text-blue-400">{{ totalPorEstado('revision') }}</div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 shadow-sm">
                <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Publicado</span>
                <div class="text-4xl font-bold mt-2 text-green-600 dark:text-green-400">{{ totalPorEstado('publicado') }}</div>
            </div>
        </div>

        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo Formulario" icon="pi pi-plus" severity="secondary" (onClick)="goToCreate()" />
            </ng-template>
        </p-toolbar>

        <p-table [value]="formularios()" [paginator]="true" [rows]="10" dataKey="id" [loading]="loading()" [tableStyle]="{ 'min-width': '70rem' }">
            <ng-template #header>
                <tr>
                    <th style="min-width: 8rem">ID</th>
                    <th style="min-width: 12rem">Código</th>
                    <th style="min-width: 18rem">Nombre</th>
                    <th style="min-width: 10rem">Versión</th>
                    <th style="min-width: 10rem">Estado</th>
                    <th style="min-width: 16rem">Acciones</th>
                </tr>
            </ng-template>
            <ng-template #body let-formulario>
                <tr>
                    <td>{{ formulario.id }}</td>
                    <td class="font-mono">{{ formulario.codigo }}</td>
                    <td class="uppercase">{{ formulario.nombre }}</td>
                    <td>{{ formulario.version || '1.0' }}</td>
                    <td>
                        <p-tag [value]="estadoLabel(formulario.estado)" [severity]="estadoSeverity(formulario.estado)"></p-tag>
                    </td>
                    <td>
                        <div class="flex gap-2">
                            <p-button label="Responder" icon="pi pi-play" severity="success" [outlined]="true" (click)="goToRespond(formulario)" />
                            <p-button label="Editar" icon="pi pi-pencil" [outlined]="true" (click)="goToEdit(formulario)" />
                            <p-button label="Eliminar" icon="pi pi-trash" severity="danger" [outlined]="true" (click)="deleteFormulario(formulario)" />
                        </div>
                    </td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="6" class="text-center py-10 text-surface-400">No hay formularios registrados.</td>
                </tr>
            </ng-template>
        </p-table>

        <p-confirmdialog />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Formularios implements OnInit {
    formularios = signal<Formulario[]>([]);
    loading = signal(false);

    constructor(
        private formularioService: FormularioService,
        private router: Router,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadFormularios();
    }

    loadFormularios() {
        this.loading.set(true);
        this.formularioService.getFormularios().subscribe({
            next: (data) => {
                this.formularios.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los formularios.', life: 4000 });
                this.loading.set(false);
            }
        });
    }

    goToCreate() {
        void this.router.navigate(['/pages/formularios/nuevo']);
    }

    goToEdit(formulario: Formulario) {
        if (!formulario.id) return;
        void this.router.navigate(['/pages/formularios', formulario.id, 'editar']);
    }

    goToRespond(formulario: Formulario) {
        if (!formulario.id) return;
        void this.router.navigate(['/pages/formularios', formulario.id, 'responder']);
    }

    deleteFormulario(formulario: Formulario) {
        if (!formulario.id) return;
        this.confirmationService.confirm({
            message: `¿Deseas eliminar el formulario <strong>${formulario.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.formularioService.deleteFormulario(formulario.id!).subscribe({
                    next: () => {
                        this.formularios.update((items) => items.filter((f) => f.id !== formulario.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Formulario eliminado.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el formulario.', life: 4000 });
                    }
                });
            }
        });
    }

    totalPorEstado(estado: string): number {
        return this.formularios().filter((f) => f.estado === estado).length;
    }

    estadoSeverity(estado: string): 'success' | 'warn' | 'info' | 'secondary' | 'danger' | 'contrast' {
        switch (estado) {
            case 'borrador':
                return 'warn';
            case 'revision':
                return 'info';
            case 'publicado':
                return 'success';
            case 'archivado':
                return 'secondary';
            default:
                return 'contrast';
        }
    }

    estadoLabel(estado: string): string {
        switch (estado) {
            case 'borrador':
                return 'Borrador';
            case 'revision':
                return 'Revisión';
            case 'publicado':
                return 'Publicado';
            case 'archivado':
                return 'Archivado';
            default:
                return estado;
        }
    }
}
