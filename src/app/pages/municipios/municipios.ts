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
import { ConfirmationService, MessageService } from 'primeng/api';
import { Municipio, MunicipioService } from '@/app/pages/service/municipio.service';
import { DepartamentoSelectComponent } from '@/app/shared/components/departamento-select/departamento-select.component';
import { EstadoSelectComponent } from '@/app/shared/components/estado-select/estado-select.component';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-municipios',
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
        DepartamentoSelectComponent,
        EstadoSelectComponent
    ],
    template: `
        <p-toast />

        <!-- ==== ESTADÍSTICAS ==== -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Municipios</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-map-marker text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalMunicipios() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Activos (Estado 1)</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                        <i class="pi pi-check-circle text-green-600 dark:text-green-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-green-600 dark:text-green-400">{{ totalActivos() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Departamentos con municipios</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900">
                        <i class="pi pi-sitemap text-purple-600 dark:text-purple-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-purple-600 dark:text-purple-400">{{ totalDepartamentos() }}</span>
            </div>
        </div>

        <!-- ==== TOOLBAR ==== -->
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button
                    severity="secondary"
                    label="Eliminar"
                    icon="pi pi-trash"
                    outlined
                    (onClick)="deleteSelected()"
                    [disabled]="!selectedMunicipios || !selectedMunicipios.length"
                />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <!-- ==== TABLA ==== -->
        <p-table
            #dt
            [value]="municipios()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['nombre', 'departamento.nombre']"
            dataKey="id"
            [(selection)]="selectedMunicipios"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} municipios"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '55rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Municipios</h5>
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
                    <th pSortableColumn="departamento.nombre" style="min-width: 16rem">
                        Departamento <p-sortIcon field="departamento.nombre" />
                    </th>
                    <th pSortableColumn="estado_id" style="min-width: 10rem">
                        Estado <p-sortIcon field="estado_id" />
                    </th>
                    <th style="min-width: 9rem"></th>
                </tr>
                <tr>
                    <th></th>
                    <th></th>
                    <th>
                        <p-columnFilter type="text" field="nombre" placeholder="Buscar municipio" ariaLabel="Filter Nombre" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="departamento.nombre" placeholder="Buscar departamento" ariaLabel="Filter Departamento" />
                    </th>
                    <th>
                        <p-columnFilter type="numeric" field="estado_id" placeholder="Ej. 1" ariaLabel="Filter Estado" />
                    </th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-mun>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="mun" />
                    </td>
                    <td>{{ mun.id }}</td>
                    <td class="uppercase">{{ mun.nombre }}</td>
                    <td class="uppercase">{{ mun.departamento?.nombre }}</td>
                    <td>{{ mun.estado_id }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editMunicipio(mun)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteMunicipio(mun)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="6" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron municipios.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- ==== DIALOG CREAR / EDITAR ==== -->
        <p-dialog [(visible)]="municipioDialog" [style]="{ width: '460px' }" [header]="dialogTitle" [modal]="true" [blockScroll]="false">
            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2">
                    <!-- Nombre -->
                    <div>
                        <label for="nombre" class="block font-semibold mb-2">
                            Nombre <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            pInputText
                            id="nombre"
                            [(ngModel)]="municipio.nombre"
                            placeholder="EJ. BOGOTÁ"
                            maxlength="150"
                            style="text-transform: uppercase"
                            fluid
                            autofocus
                        />
                        @if (submitted && !municipio.nombre) {
                            <small class="text-red-500">El nombre es requerido.</small>
                        }
                    </div>

                    <!-- Departamento -->
                    <div>
                        <label for="departamento_id" class="block font-semibold mb-2">
                            Departamento <span class="text-red-500">*</span>
                        </label>
                        <app-departamento-select [(ngModel)]="municipio.departamento_id" />
                        @if (submitted && !municipio.departamento_id) {
                            <small class="text-red-500">El departamento es requerido.</small>
                        }
                    </div>

                    <!-- Estado -->
                    <div>
                        <label for="estado_id" class="block font-semibold mb-2">Estado</label>
                        <app-estado-select [(ngModel)]="municipio.estado_id" />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveMunicipio()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Municipios implements OnInit {
    municipioDialog = false;
    dialogTitle = 'Nuevo Municipio';

    municipios = signal<Municipio[]>([]);
    loading = signal(false);
    saving = signal(false);

    municipio: Partial<Municipio> = {};
    selectedMunicipios: Municipio[] | null = null;
    submitted = false;

    totalMunicipios = computed(() => this.municipios().length);
    totalActivos = computed(() => this.municipios().filter((m) => m.estado_id == 1).length);
    totalDepartamentos = computed(() => new Set(this.municipios().map((m) => m.departamento_id)).size);

    @ViewChild('dt') dt!: Table;

    constructor(
        private municipioService: MunicipioService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadMunicipios();
    }

    loadMunicipios() {
        this.loading.set(true);
        this.municipioService.getAll().subscribe({
            next: (data) => {
                this.municipios.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los municipios.', life: 4000 });
                this.loading.set(false);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.municipio = { estado_id: 1 };
        this.submitted = false;
        this.dialogTitle = 'Nuevo Municipio';
        this.municipioDialog = true;
    }

    editMunicipio(m: Municipio) {
        this.municipio = { ...m };
        this.submitted = false;
        this.dialogTitle = 'Editar Municipio';
        this.municipioDialog = true;
    }

    hideDialog() {
        this.municipioDialog = false;
        this.submitted = false;
    }

    saveMunicipio() {
        this.submitted = true;
        if (!this.municipio.nombre?.trim() || !this.municipio.departamento_id) return;

        const payload: Partial<Municipio> = {
            nombre: this.municipio.nombre.trim().toUpperCase(),
            departamento_id: this.municipio.departamento_id,
            estado_id: this.municipio.estado_id ?? 1
        };

        this.saving.set(true);

        if (this.municipio.id) {
            this.municipioService.update(this.municipio.id, payload).subscribe({
                next: (updated) => {
                    this.municipios.update((list) => list.map((m) => (m.id == updated.id ? updated : m)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Municipio actualizado.', life: 3000 });
                    this.municipioDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo actualizar el municipio.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        } else {
            this.municipioService.create(payload).subscribe({
                next: (created) => {
                    this.municipios.update((list) => [...list, created]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Municipio creado.', life: 3000 });
                    this.municipioDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo crear el municipio.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        }
    }

    deleteMunicipio(m: Municipio) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar <strong>${m.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.municipioService.delete(m.id!).subscribe({
                    next: () => {
                        this.municipios.update((list) => list.filter((item) => item.id !== m.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Municipio eliminado.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el municipio.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelected() {
        if (!this.selectedMunicipios?.length) return;
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar los <strong>${this.selectedMunicipios.length}</strong> municipios seleccionados?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.selectedMunicipios!.map((m) => m.id!);
                let completed = 0;
                ids.forEach((id) => {
                    this.municipioService.delete(id).subscribe({
                        next: () => {
                            completed++;
                            this.municipios.update((list) => list.filter((item) => item.id !== id));
                            if (completed == ids.length) {
                                this.selectedMunicipios = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Municipios eliminados.', life: 3000 });
                            }
                        }
                    });
                });
            }
        });
    }

    exportExcel() {
        const data = this.municipios().map((m) => ({
            ID: m.id,
            Nombre: m.nombre,
            Departamento: m.departamento?.nombre ?? '',
            'Estado': m.estado_id
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Municipios');
        worksheet['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 28 }, { wch: 12 }];
        XLSX.writeFile(workbook, `Municipios_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
}
