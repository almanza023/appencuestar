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
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EstadoSelectComponent } from '@/app/shared/components/estado-select/estado-select.component';
import { AutorizacionDato, AutorizacionDatoService } from '@/app/pages/service/autorizacion-dato.service';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-autorizaciones-datos',
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
        CheckboxModule,
        TooltipModule,
        EstadoSelectComponent
    ],
    template: `
        <p-toast />

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Autorizaciones</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-shield text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalAutorizaciones() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Habilitadas</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                        <i class="pi pi-check-circle text-green-600 dark:text-green-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-green-600 dark:text-green-400">{{ totalHabilitadas() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Deshabilitadas</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900">
                        <i class="pi pi-ban text-amber-600 dark:text-amber-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-amber-600 dark:text-amber-400">{{ totalDeshabilitadas() }}</span>
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
                    [disabled]="!selectedAutorizaciones || !selectedAutorizaciones.length"
                />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="autorizaciones()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['id', 'descripcion', 'habilitado', 'estado_id']"
            dataKey="id"
            [(selection)]="selectedAutorizaciones"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} autorizaciones"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '72rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between gap-3">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Autorización de Datos</h5>
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
                    <th pSortableColumn="descripcion" style="min-width: 32rem">
                        Descripcion <p-sortIcon field="descripcion" />
                    </th>
                    <th pSortableColumn="habilitado" style="min-width: 10rem">
                        Habilitado <p-sortIcon field="habilitado" />
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
                        <p-columnFilter type="text" field="descripcion" placeholder="Buscar descripcion" ariaLabel="Filter Descripcion" />
                    </th>
                    <th>
                        <p-columnFilter type="boolean" field="habilitado" />
                    </th>
                    <th>
                        <p-columnFilter type="numeric" field="estado_id" placeholder="Ej. 1" ariaLabel="Filter Estado ID" />
                    </th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-autorizacion>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="autorizacion" />
                    </td>
                    <td>{{ autorizacion.id }}</td>
                    <td class="whitespace-normal leading-relaxed">{{ autorizacion.descripcion }}</td>
                    <td>
                        @if (autorizacion.habilitado) {
                            <span class="text-green-600 font-semibold">Si</span>
                        } @else {
                            <span class="text-amber-600 font-semibold">No</span>
                        }
                    </td>
                    <td>{{ autorizacion.estado_id ?? '-' }}</td>
                    <td>
                        <p-button
                            icon="pi pi-pencil"
                            class="mr-2"
                            [rounded]="true"
                            [outlined]="true"
                            (click)="editAutorizacion(autorizacion)"
                            pTooltip="Editar"
                            tooltipPosition="top"
                        />
                        <p-button
                            icon="pi pi-trash"
                            severity="danger"
                            [rounded]="true"
                            [outlined]="true"
                            (click)="deleteAutorizacion(autorizacion)"
                            pTooltip="Eliminar"
                            tooltipPosition="top"
                        />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="6" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron autorizaciones de datos.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="autorizacionDialog" [style]="{ width: '620px' }" [header]="dialogTitle" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2">
                    <div>
                        <label for="descripcion" class="block font-semibold mb-2">
                            Descripcion <span class="text-red-500">*</span>
                        </label>
                        <textarea
                            id="descripcion"
                            pTextarea
                            [(ngModel)]="autorizacion.descripcion"
                            rows="6"
                            placeholder="Autorizo de manera previa, expresa e informada el tratamiento de mis datos personales..."
                            maxlength="3000"
                            fluid
                            autofocus
                        ></textarea>
                        @if (submitted && !autorizacion.descripcion?.trim()) {
                            <small class="text-red-500">La descripcion es requerida.</small>
                        }
                    </div>

                    <div>
                        <label for="estado_id" class="block font-semibold mb-2">Estado ID</label>
                        <app-estado-select [(ngModel)]="autorizacion.estado_id" />
                    </div>

                    <div class="flex items-center gap-3">
                        <p-checkbox inputId="habilitado" [(ngModel)]="autorizacion.habilitado" [binary]="true" />
                        <label for="habilitado" class="font-semibold m-0">Habilitado</label>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveAutorizacion()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class AutorizacionesDatos implements OnInit {
    autorizacionDialog = false;
    dialogTitle = 'Nueva Autorizacion de Datos';

    autorizaciones = signal<AutorizacionDato[]>([]);
    loading = signal(false);
    saving = signal(false);

    autorizacion: Partial<AutorizacionDato> = {};
    selectedAutorizaciones: AutorizacionDato[] | null = null;
    submitted = false;

    totalAutorizaciones = computed(() => this.autorizaciones().length);
    totalHabilitadas = computed(() => this.autorizaciones().filter((item) => item.habilitado).length);
    totalDeshabilitadas = computed(() => this.autorizaciones().filter((item) => !item.habilitado).length);

    @ViewChild('dt') dt!: Table;

    constructor(
        private autorizacionDatoService: AutorizacionDatoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadAutorizaciones();
    }

    loadAutorizaciones() {
        this.loading.set(true);
        this.autorizacionDatoService.getAll().subscribe({
            next: (data) => {
                this.autorizaciones.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las autorizaciones de datos.', life: 4000 });
                this.loading.set(false);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.autorizacion = {
            descripcion: '',
            habilitado: true,
            estado_id: 1
        };
        this.submitted = false;
        this.dialogTitle = 'Nueva Autorizacion de Datos';
        this.autorizacionDialog = true;
    }

    editAutorizacion(autorizacion: AutorizacionDato) {
        this.autorizacion = { ...autorizacion };
        this.submitted = false;
        this.dialogTitle = 'Editar Autorizacion de Datos';
        this.autorizacionDialog = true;
    }

    hideDialog() {
        this.autorizacionDialog = false;
        this.submitted = false;
    }

    saveAutorizacion() {
        this.submitted = true;
        if (!this.autorizacion.descripcion?.trim()) return;

        const payload: Partial<AutorizacionDato> = {
            descripcion: this.autorizacion.descripcion.trim(),
            habilitado: this.autorizacion.habilitado ?? true,
            estado_id: this.autorizacion.estado_id ?? 1
        };

        this.saving.set(true);

        if (this.autorizacion.id) {
            this.autorizacionDatoService.update(this.autorizacion.id, payload).subscribe({
                next: (updated) => {
                    this.autorizaciones.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
                    this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Autorizacion de datos actualizada.', life: 3000 });
                    this.autorizacionDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo actualizar la autorizacion de datos.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        } else {
            this.autorizacionDatoService.create(payload).subscribe({
                next: (created) => {
                    this.autorizaciones.update((list) => [...list, created]);
                    this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Autorizacion de datos creada.', life: 3000 });
                    this.autorizacionDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo crear la autorizacion de datos.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        }
    }

    deleteAutorizacion(autorizacion: AutorizacionDato) {
        this.confirmationService.confirm({
            message: `¿Estas seguro de eliminar la autorizacion #${autorizacion.id}?`,
            header: 'Confirmar eliminacion',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Si, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.autorizacionDatoService.delete(autorizacion.id!).subscribe({
                    next: () => {
                        this.autorizaciones.update((list) => list.filter((item) => item.id !== autorizacion.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Autorizacion de datos eliminada.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la autorizacion de datos.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelected() {
        if (!this.selectedAutorizaciones?.length) return;

        this.confirmationService.confirm({
            message: `¿Estas seguro de eliminar las <strong>${this.selectedAutorizaciones.length}</strong> autorizaciones seleccionadas?`,
            header: 'Confirmar eliminacion',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Si, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.selectedAutorizaciones!.map((item) => item.id!);
                let completed = 0;
                ids.forEach((id) => {
                    this.autorizacionDatoService.delete(id).subscribe({
                        next: () => {
                            completed++;
                            this.autorizaciones.update((list) => list.filter((item) => item.id !== id));
                            if (completed === ids.length) {
                                this.selectedAutorizaciones = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminadas', detail: 'Autorizaciones eliminadas.', life: 3000 });
                            }
                        },
                        error: () => {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron eliminar todas las autorizaciones.', life: 4000 });
                        }
                    });
                });
            }
        });
    }

    exportExcel() {
        const data = this.autorizaciones().map((item) => ({
            ID: item.id,
            Descripcion: item.descripcion,
            Habilitado: item.habilitado ? 'Si' : 'No',
            EstadoID: item.estado_id ?? '',
            Creado: item.created_at ?? '',
            Actualizado: item.updated_at ?? ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'AutorizacionesDatos');
        worksheet['!cols'] = [{ wch: 8 }, { wch: 80 }, { wch: 14 }, { wch: 10 }, { wch: 24 }, { wch: 24 }];
        XLSX.writeFile(workbook, `Autorizaciones_Datos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
}
