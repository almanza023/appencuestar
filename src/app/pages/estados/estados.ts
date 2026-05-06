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
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Estado, EstadoService } from '@/app/pages/service/estado.service';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-estados',
    standalone: true,
    imports: [CommonModule, TableModule, FormsModule, ButtonModule, RippleModule, ToastModule, ToolbarModule, InputTextModule, DialogModule, InputIconModule, IconFieldModule, ConfirmDialogModule, TooltipModule],
    template: `
        <p-toast />

        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Estados</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-tags text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalEstados() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">ACTIVO</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                        <i class="pi pi-check-circle text-green-600 dark:text-green-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-green-600 dark:text-green-400">{{ totalActivos() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Otros Estados</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900">
                        <i class="pi pi-minus-circle text-amber-600 dark:text-amber-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-amber-600 dark:text-amber-400">{{ totalOtros() }}</span>
            </div>
        </div>

        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Eliminar" icon="pi pi-trash" outlined (onClick)="deleteSelected()" [disabled]="!selectedEstados || !selectedEstados.length" />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="estados()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['id', 'nombre']"
            dataKey="id"
            [(selection)]="selectedEstados"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} estados"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '45rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Estados</h5>
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
                    <th pSortableColumn="id" style="min-width: 8rem">
                        ID <p-sortIcon field="id" />
                    </th>
                    <th pSortableColumn="nombre" style="min-width: 22rem">
                        Nombre <p-sortIcon field="nombre" />
                    </th>
                    <th style="min-width: 9rem"></th>
                </tr>
                <tr>
                    <th></th>
                    <th>
                        <p-columnFilter type="numeric" field="id" placeholder="Ej. 1" ariaLabel="Filter ID" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="nombre" placeholder="Buscar nombre" ariaLabel="Filter Nombre" />
                    </th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-estado>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="estado" />
                    </td>
                    <td>{{ estado.id }}</td>
                    <td class="uppercase font-medium">{{ estado.nombre }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editEstado(estado)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteEstado(estado)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="4" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron estados.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="estadoDialog" [style]="{ width: '420px' }" [header]="dialogTitle" [modal]="true" [blockScroll]="false">
            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2">
                    <div>
                        <label for="nombre" class="block font-semibold mb-2">
                            Nombre <span class="text-red-500">*</span>
                        </label>
                        <input type="text" pInputText id="nombre" [(ngModel)]="estado.nombre" placeholder="EJ. ACTIVO" maxlength="100" style="text-transform: uppercase" fluid autofocus />
                        @if (submitted && !estado.nombre?.trim()) {
                            <small class="text-red-500">El nombre es requerido.</small>
                        }
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveEstado()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Estados implements OnInit {
    estadoDialog = false;
    dialogTitle = 'Nuevo Estado';
    editingEstadoId: number | null = null;

    estados = signal<Estado[]>([]);
    loading = signal(false);
    saving = signal(false);

    estado: Partial<Estado> = {};
    selectedEstados: Estado[] | null = null;
    submitted = false;

    totalEstados = computed(() => this.estados().length);
    totalActivos = computed(() => this.estados().filter((estado) => estado.nombre?.trim().toUpperCase() == 'ACTIVO').length);
    totalOtros = computed(() => this.estados().filter((estado) => estado.nombre?.trim().toUpperCase() !== 'ACTIVO').length);

    @ViewChild('dt') dt!: Table;

    constructor(
        private estadoService: EstadoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadEstados();
    }

    loadEstados() {
        this.loading.set(true);
        this.estadoService.getAll().subscribe({
            next: (data) => {
                this.estados.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los estados.', life: 4000 });
                this.loading.set(false);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.estado = {};
        this.editingEstadoId = null;
        this.submitted = false;
        this.dialogTitle = 'Nuevo Estado';
        this.estadoDialog = true;
    }

    editEstado(estado: Estado) {
        this.estado = { ...estado };
        this.editingEstadoId = estado.id ?? null;
        this.submitted = false;
        this.dialogTitle = 'Editar Estado';
        this.estadoDialog = true;
    }

    hideDialog() {
        this.estadoDialog = false;
        this.editingEstadoId = null;
        this.submitted = false;
    }

    saveEstado() {
        this.submitted = true;
        if (!this.estado.nombre?.trim()) return;

        const payload: Partial<Estado> = {
            nombre: this.estado.nombre.trim().toUpperCase()
        };

        this.saving.set(true);

        if (this.editingEstadoId !== null) {
            this.estadoService.update(this.editingEstadoId, payload).subscribe({
                next: (updated) => {
                    this.estados.update((list) => list.map((item) => (item.id == updated.id ? updated : item)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado.', life: 3000 });
                    this.estadoDialog = false;
                    this.editingEstadoId = null;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo actualizar el estado.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        } else {
            this.estadoService.create(payload).subscribe({
                next: (created) => {
                    this.estados.update((list) => [...list, created]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estado creado.', life: 3000 });
                    this.estadoDialog = false;
                    this.editingEstadoId = null;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo crear el estado.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.editingEstadoId = null;
                    this.saving.set(false);
                }
            });
        }
    }

    deleteEstado(estado: Estado) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar <strong>${estado.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.estadoService.delete(estado.id!).subscribe({
                    next: () => {
                        this.estados.update((list) => list.filter((item) => item.id !== estado.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Estado eliminado.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el estado.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelected() {
        if (!this.selectedEstados?.length) return;
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar los <strong>${this.selectedEstados.length}</strong> estados seleccionados?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.selectedEstados!.map((estado) => estado.id!);
                let completed = 0;
                ids.forEach((id) => {
                    this.estadoService.delete(id).subscribe({
                        next: () => {
                            completed++;
                            this.estados.update((list) => list.filter((item) => item.id !== id));
                            if (completed == ids.length) {
                                this.selectedEstados = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Estados eliminados.', life: 3000 });
                            }
                        },
                        error: () => {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron eliminar todos los estados seleccionados.', life: 4000 });
                        }
                    });
                });
            }
        });
    }

    exportExcel() {
        const data = this.estados().map((estado) => ({
            ID: estado.id,
            Nombre: estado.nombre
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Estados');
        worksheet['!cols'] = [{ wch: 10 }, { wch: 28 }];
        XLSX.writeFile(workbook, `Estados_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
}
