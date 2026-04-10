import { Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Rol, RolService } from '@/app/pages/service/rol.service';
import { EstadoSelectComponent } from '@/app/shared/components/estado-select/estado-select.component';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        TextareaModule,
        TooltipModule,
        EstadoSelectComponent
    ],
    template: `
        <p-toast />

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Roles</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-users text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalRoles() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Activos</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                        <i class="pi pi-check-circle text-green-600 dark:text-green-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-green-600 dark:text-green-400">{{ totalActivos() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Con Descripción</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900">
                        <i class="pi pi-align-left text-amber-600 dark:text-amber-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-amber-600 dark:text-amber-400">{{ totalConDescripcion() }}</span>
            </div>
        </div>

        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button
                    severity="secondary"
                    label="Eliminar"
                    icon="pi pi-trash"
                    outlined
                    (onClick)="deleteSelected()"
                    [disabled]="!selectedRoles || !selectedRoles.length"
                />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="roles()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['nombre', 'descripcion', 'estado_id']"
            dataKey="id"
            [(selection)]="selectedRoles"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} roles"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '60rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between gap-3">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Roles</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th style="width: 3rem">
                        <p-tableHeaderCheckbox />
                    </th>
                    <th pSortableColumn="id" style="min-width: 6rem">
                        ID <p-sortIcon field="id" />
                    </th>
                    <th pSortableColumn="nombre" style="min-width: 16rem">
                        Nombre <p-sortIcon field="nombre" />
                    </th>
                    <th pSortableColumn="descripcion" style="min-width: 24rem">
                        Descripción <p-sortIcon field="descripcion" />
                    </th>
                    <th pSortableColumn="estado_id" style="min-width: 10rem">
                        Estado ID <p-sortIcon field="estado_id" />
                    </th>
                    <th style="min-width: 9rem"></th>
                </tr>
                <tr>
                    <th></th>
                    <th></th>
                    <th>
                        <p-columnFilter type="text" field="nombre" placeholder="Buscar nombre" ariaLabel="Filter Nombre" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="descripcion" placeholder="Buscar descripción" ariaLabel="Filter Descripción" />
                    </th>
                    <th>
                        <p-columnFilter type="numeric" field="estado_id" placeholder="Ej. 1" ariaLabel="Filter Estado ID" />
                    </th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-rol>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="rol" />
                    </td>
                    <td>{{ rol.id }}</td>
                    <td class="uppercase font-medium">{{ rol.nombre }}</td>
                    <td>{{ rol.descripcion || 'Sin descripción' }}</td>
                    <td>{{ rol.estado_id }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editRol(rol)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteRol(rol)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="6" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron roles.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="rolDialog" [style]="{ width: '520px' }" [header]="dialogTitle" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2">
                    <div>
                        <label for="nombre" class="block font-semibold mb-2">
                            Nombre <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            pInputText
                            id="nombre"
                            [(ngModel)]="rol.nombre"
                            placeholder="EJ. ADMINISTRADOR"
                            maxlength="150"
                            style="text-transform: uppercase"
                            fluid
                            autofocus
                        />
                        @if (submitted && !rol.nombre?.trim()) {
                            <small class="text-red-500">El nombre es requerido.</small>
                        }
                    </div>

                    <div>
                        <label for="descripcion" class="block font-semibold mb-2">Descripción</label>
                        <textarea id="descripcion" pTextarea [(ngModel)]="rol.descripcion" rows="4" placeholder="Describe el alcance del rol" fluid></textarea>
                    </div>

                    <div>
                        <label for="estado_id" class="block font-semibold mb-2">Estado ID</label>
                        <app-estado-select [(ngModel)]="rol.estado_id" />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveRol()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Roles implements OnInit {
    rolDialog = false;
    dialogTitle = 'Nuevo Rol';

    roles = signal<Rol[]>([]);
    loading = signal(false);
    saving = signal(false);

    rol: Partial<Rol> = {};
    selectedRoles: Rol[] | null = null;
    submitted = false;

    totalRoles = computed(() => this.roles().length);
    totalActivos = computed(() => this.roles().filter((rol) => rol.estado_id === 1).length);
    totalConDescripcion = computed(() => this.roles().filter((rol) => !!rol.descripcion?.trim()).length);

    @ViewChild('dt') dt!: Table;

    constructor(
        private rolService: RolService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadRoles();
    }

    loadRoles() {
        this.loading.set(true);
        this.rolService.getAll().subscribe({
            next: (data) => {
                this.roles.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles.', life: 4000 });
                this.loading.set(false);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.rol = { estado_id: 1, descripcion: null };
        this.submitted = false;
        this.dialogTitle = 'Nuevo Rol';
        this.rolDialog = true;
    }

    editRol(rol: Rol) {
        this.rol = { ...rol };
        this.submitted = false;
        this.dialogTitle = 'Editar Rol';
        this.rolDialog = true;
    }

    hideDialog() {
        this.rolDialog = false;
        this.submitted = false;
    }

    saveRol() {
        this.submitted = true;
        if (!this.rol.nombre?.trim()) return;

        const payload: Partial<Rol> = {
            nombre: this.rol.nombre.trim().toUpperCase(),
            descripcion: this.rol.descripcion?.trim() || null,
            estado_id: this.rol.estado_id ?? 1
        };

        this.saving.set(true);

        if (this.rol.id) {
            this.rolService.update(this.rol.id, payload).subscribe({
                next: (updated) => {
                    this.roles.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol actualizado.', life: 3000 });
                    this.rolDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo actualizar el rol.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        } else {
            this.rolService.create(payload).subscribe({
                next: (created) => {
                    this.roles.update((list) => [...list, created]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol creado.', life: 3000 });
                    this.rolDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo crear el rol.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        }
    }

    deleteRol(rol: Rol) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar <strong>${rol.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.rolService.delete(rol.id!).subscribe({
                    next: () => {
                        this.roles.update((list) => list.filter((item) => item.id !== rol.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Rol eliminado.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el rol.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelected() {
        if (!this.selectedRoles?.length) return;

        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar los <strong>${this.selectedRoles.length}</strong> roles seleccionados?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.selectedRoles!.map((rol) => rol.id!);
                let completed = 0;

                ids.forEach((id) => {
                    this.rolService.delete(id).subscribe({
                        next: () => {
                            completed++;
                            this.roles.update((list) => list.filter((item) => item.id !== id));
                            if (completed === ids.length) {
                                this.selectedRoles = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Roles eliminados.', life: 3000 });
                            }
                        },
                        error: () => {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron eliminar todos los roles seleccionados.', life: 4000 });
                        }
                    });
                });
            }
        });
    }

    exportExcel() {
        const data = this.roles().map((rol) => ({
            ID: rol.id,
            Nombre: rol.nombre,
            Descripción: rol.descripcion || '',
            'Estado ID': rol.estado_id
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Roles');
        worksheet['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 40 }, { wch: 12 }];
        XLSX.writeFile(workbook, `Roles_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
}
