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
import { Departamento, DepartamentoService } from '@/app/pages/service/departamento.service';
import { EstadoSelectComponent } from '@/app/shared/components/estado-select/estado-select.component';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-departamentos',
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
        EstadoSelectComponent
    ],
    template: `
        <p-toast />

        <!-- ===== ESTADÍSTICAS ===== -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Departamentos</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-map text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalDepartamentos() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Estado Activo (ID 1)</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                        <i class="pi pi-check-circle text-green-600 dark:text-green-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-green-600 dark:text-green-400">{{ totalEstado1() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Otro Estado</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900">
                        <i class="pi pi-pause-circle text-yellow-600 dark:text-yellow-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{{ totalOtroEstado() }}</span>
            </div>
        </div>

        <!-- ===== TOOLBAR ===== -->
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button
                    severity="secondary"
                    label="Eliminar"
                    icon="pi pi-trash"
                    outlined
                    (onClick)="deleteSelected()"
                    [disabled]="!selectedDepartamentos || !selectedDepartamentos.length"
                />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <!-- ===== TABLA ===== -->
        <p-table
            #dt
            [value]="departamentos()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['nombre', 'estado_id']"
            dataKey="id"
            [(selection)]="selectedDepartamentos"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} departamentos"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '45rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Departamentos</h5>
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
                    <th pSortableColumn="nombre" style="min-width: 18rem">
                        Nombre <p-sortIcon field="nombre" />
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
                        <p-columnFilter type="numeric" field="estado_id" placeholder="Ej. 1" ariaLabel="Filter Estado ID" />
                    </th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-dep>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="dep" />
                    </td>
                    <td>{{ dep.id }}</td>
                    <td class="uppercase">{{ dep.nombre }}</td>
                    <td>{{ dep.estado_id }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editDepartamento(dep)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteDepartamento(dep)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="5" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron departamentos.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- ===== DIALOG CREAR / EDITAR ===== -->
        <p-dialog [(visible)]="departamentoDialog" [style]="{ width: '420px' }" [header]="dialogTitle" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2">
                    <div>
                        <label for="nombre" class="block font-semibold mb-2">
                            Nombre <span class="text-red-500">*</span>
                        </label>
                        <input type="text" pInputText id="nombre" [(ngModel)]="departamento.nombre" placeholder="EJ. CUNDINAMARCA" maxlength="150" style="text-transform: uppercase" fluid autofocus />
                        @if (submitted && !departamento.nombre) {
                            <small class="text-red-500">El nombre es requerido.</small>
                        }
                    </div>
                    <div>
                        <label for="estado_id" class="block font-semibold mb-2">Estado ID</label>
                        <app-estado-select [(ngModel)]="departamento.estado_id" />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveDepartamento()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Departamentos implements OnInit {
    departamentoDialog = false;
    dialogTitle = 'Nuevo Departamento';

    departamentos = signal<Departamento[]>([]);
    loading = signal(false);
    saving = signal(false);

    departamento: Partial<Departamento> = {};
    selectedDepartamentos: Departamento[] | null = null;
    submitted = false;

    totalDepartamentos = computed(() => this.departamentos().length);
    totalEstado1 = computed(() => this.departamentos().filter((d) => d.estado_id === 1).length);
    totalOtroEstado = computed(() => this.departamentos().filter((d) => d.estado_id !== 1).length);

    @ViewChild('dt') dt!: Table;

    constructor(
        private departamentoService: DepartamentoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadDepartamentos();
    }

    loadDepartamentos() {
        this.loading.set(true);
        this.departamentoService.getAll().subscribe({
            next: (data) => {
                this.departamentos.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los departamentos.', life: 4000 });
                this.loading.set(false);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.departamento = { estado_id: 1 };
        this.submitted = false;
        this.dialogTitle = 'Nuevo Departamento';
        this.departamentoDialog = true;
    }

    editDepartamento(d: Departamento) {
        this.departamento = { ...d };
        this.submitted = false;
        this.dialogTitle = 'Editar Departamento';
        this.departamentoDialog = true;
    }

    hideDialog() {
        this.departamentoDialog = false;
        this.submitted = false;
    }

    saveDepartamento() {
        this.submitted = true;
        if (!this.departamento.nombre?.trim()) return;

        const payload: Partial<Departamento> = {
            nombre: this.departamento.nombre.trim().toUpperCase(),
            estado_id: this.departamento.estado_id ?? 1
        };

        this.saving.set(true);

        if (this.departamento.id) {
            this.departamentoService.update(this.departamento.id, payload).subscribe({
                next: (updated) => {
                    this.departamentos.update((list) => list.map((d) => (d.id === updated.id ? updated : d)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Departamento actualizado.', life: 3000 });
                    this.departamentoDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo actualizar el departamento.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        } else {
            this.departamentoService.create(payload).subscribe({
                next: (created) => {
                    this.departamentos.update((list) => [...list, created]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Departamento creado.', life: 3000 });
                    this.departamentoDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo crear el departamento.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        }
    }

    deleteDepartamento(d: Departamento) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar <strong>${d.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.departamentoService.delete(d.id!).subscribe({
                    next: () => {
                        this.departamentos.update((list) => list.filter((item) => item.id !== d.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Departamento eliminado.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el departamento.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelected() {
        if (!this.selectedDepartamentos?.length) return;
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar los <strong>${this.selectedDepartamentos.length}</strong> departamentos seleccionados?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.selectedDepartamentos!.map((d) => d.id!);
                let completed = 0;
                ids.forEach((id) => {
                    this.departamentoService.delete(id).subscribe({
                        next: () => {
                            completed++;
                            this.departamentos.update((list) => list.filter((item) => item.id !== id));
                            if (completed === ids.length) {
                                this.selectedDepartamentos = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Departamentos eliminados.', life: 3000 });
                            }
                        }
                    });
                });
            }
        });
    }

    exportExcel() {
        const data = this.departamentos().map((d) => ({
            ID: d.id,
            Nombre: d.nombre,
            'Estado ID': d.estado_id
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Departamentos');
        worksheet['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 12 }];
        XLSX.writeFile(workbook, `Departamentos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
}
