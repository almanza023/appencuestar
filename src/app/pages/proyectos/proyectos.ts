import { Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Proyecto, ProyectoService } from '@/app/pages/service/proyecto.service';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-proyectos',
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
        TextareaModule,
        SelectModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule
    ],
    template: `
        <p-toast />

        <!-- ==== CABECERA DE ESTADÍSTICAS ==== -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Proyectos</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-briefcase text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalProyectos() }}</span>
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
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Inactivos</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900">
                        <i class="pi pi-pause-circle text-yellow-600 dark:text-yellow-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{{ totalInactivos() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Finalizados</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-700">
                        <i class="pi pi-flag-fill text-surface-500 dark:text-surface-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-500 dark:text-surface-300">{{ totalFinalizados() }}</span>
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
                    (onClick)="deleteSelectedProyectos()"
                    [disabled]="!selectedProyectos || !selectedProyectos.length"
                />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <!-- ==== TABLA ==== -->
        <p-table
            #dt
            [value]="proyectos()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['codigo', 'nombre', 'descripcion', 'estado']"
            dataKey="id"
            [(selection)]="selectedProyectos"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} proyectos"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '70rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Proyectos</h5>
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
                    <th pSortableColumn="codigo" style="min-width: 9rem">
                        Código <p-sortIcon field="codigo" />
                    </th>
                    <th pSortableColumn="nombre" style="min-width: 14rem">
                        Nombre <p-sortIcon field="nombre" />
                    </th>
                    <th style="min-width: 16rem">Descripción</th>
                    <th pSortableColumn="fecha_inicio" style="min-width: 10rem">
                        Fecha Inicio <p-sortIcon field="fecha_inicio" />
                    </th>
                    <th pSortableColumn="fecha_fin" style="min-width: 10rem">
                        Fecha Fin <p-sortIcon field="fecha_fin" />
                    </th>
                    <th pSortableColumn="estado" style="min-width: 10rem">
                        Estado <p-sortIcon field="estado" />
                    </th>
                    <th style="min-width: 9rem"></th>
                </tr>
                <tr>
                    <th></th>
                    <th>
                        <p-columnFilter type="text" field="codigo" placeholder="Buscar código" ariaLabel="Filter Código" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="nombre" placeholder="Buscar nombre" ariaLabel="Filter Nombre" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="descripcion" placeholder="Buscar descripción" ariaLabel="Filter Descripción" />
                    </th>
                    <th>
                        <p-columnFilter type="date" field="fecha_inicio" placeholder="dd/mm/yyyy" ariaLabel="Filter Fecha Inicio" />
                    </th>
                    <th>
                        <p-columnFilter type="date" field="fecha_fin" placeholder="dd/mm/yyyy" ariaLabel="Filter Fecha Fin" />
                    </th>
                    <th>
                        <p-columnFilter field="estado" matchMode="equals" [showMenu]="false">
                            <ng-template #filter let-value let-filter="filterCallback">
                                <p-select
                                    appendTo="body"
                                    [ngModel]="value"
                                    (ngModelChange)="filter($event)"
                                    [options]="estadosFiltro"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Todos"
                                    style="min-width: 8rem"
                                    [showClear]="true"
                                />
                            </ng-template>
                        </p-columnFilter>
                    </th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-proyecto>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="proyecto" />
                    </td>
                    <td>
                        <span class="font-mono font-medium">{{ proyecto.codigo }}</span>
                    </td>
                    <td class="uppercase">{{ proyecto.nombre }}</td>
                    <td>
                        <span class="text-surface-600 dark:text-surface-300 text-sm line-clamp-2">
                            {{ proyecto.descripcion || '—' }}
                        </span>
                    </td>
                    <td>{{ proyecto.fecha_inicio | date: 'dd/MM/yyyy' }}</td>
                    <td>{{ proyecto.fecha_fin | date: 'dd/MM/yyyy' }}</td>
                    <td>
                        <p-tag [value]="getEstadoLabel(proyecto.estado)" [severity]="getSeverity(proyecto.estado)" />
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editProyecto(proyecto)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteProyecto(proyecto)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="8" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron proyectos.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- ==== DIALOG CREAR / EDITAR ==== -->
        <p-dialog [(visible)]="proyectoDialog" [style]="{ width: '520px' }" [header]="dialogTitle" [modal]="true" [blockScroll]="false" [closable]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2">
                    <!-- Nombre -->
                    <div>
                        <label for="nombre" class="block font-semibold mb-2">
                            Nombre <span class="text-red-500">*</span>
                        </label>
                        <input type="text" pInputText id="nombre" [(ngModel)]="proyecto.nombre" placeholder="NOMBRE DEL PROYECTO" style="text-transform: uppercase" fluid autofocus />
                        @if (submitted && !proyecto.nombre) {
                            <small class="text-red-500">El nombre es requerido.</small>
                        }
                    </div>

                    <!-- Código -->
                    <div>
                        <label for="codigo" class="block font-semibold mb-2">
                            Código <span class="text-red-500">*</span>
                        </label>
                        <input type="text" pInputText id="codigo" [(ngModel)]="proyecto.codigo" placeholder="ENC-2026" fluid />
                        @if (submitted && !proyecto.codigo) {
                            <small class="text-red-500">El código es requerido.</small>
                        }
                    </div>

                    <!-- Descripción -->
                    <div>
                        <label for="descripcion" class="block font-semibold mb-2">Descripción</label>
                        <textarea id="descripcion" pTextarea [(ngModel)]="proyecto.descripcion" rows="3" placeholder="Descripción del proyecto..." fluid></textarea>
                    </div>

                    <!-- Fechas -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="fecha_inicio" class="block font-semibold mb-2">Fecha Inicio</label>
                            <input type="date" pInputText id="fecha_inicio" [(ngModel)]="proyecto.fecha_inicio" style="width:100%" />
                        </div>
                        <div>
                            <label for="fecha_fin" class="block font-semibold mb-2">Fecha Fin</label>
                            <input type="date" pInputText id="fecha_fin" [(ngModel)]="proyecto.fecha_fin" style="width:100%" />
                        </div>
                    </div>

                    <!-- Estado -->
                    <div>
                        <label for="estado" class="block font-semibold mb-2">
                            Estado <span class="text-red-500">*</span>
                        </label>
                        <p-select
                            appendTo="body"
                            [(ngModel)]="proyecto.estado"
                            inputId="estado"
                            [options]="estados"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Selecciona un estado"
                            fluid
                        />
                        @if (submitted && !proyecto.estado) {
                            <small class="text-red-500">El estado es requerido.</small>
                        }
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveProyecto()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Proyectos implements OnInit {
    proyectoDialog = false;
    dialogTitle = 'Nuevo Proyecto';

    proyectos = signal<Proyecto[]>([]);
    loading = signal(false);
    saving = signal(false);

    proyecto: Partial<Proyecto> = {};
    selectedProyectos: Proyecto[] | null = null;
    submitted = false;

    estadosFiltro = [
        { label: 'Activo', value: 'activo' },
        { label: 'Inactivo', value: 'inactivo' },
        { label: 'Finalizado', value: 'finalizado' }
    ];

    estados = [
        { label: 'Activo', value: 'activo' },
        { label: 'Inactivo', value: 'inactivo' },
        { label: 'Finalizado', value: 'finalizado' }
    ];

    // Estadísticas computadas
    totalProyectos = computed(() => this.proyectos().length);
    totalActivos = computed(() => this.proyectos().filter((p) => p.estado == 'activo').length);
    totalInactivos = computed(() => this.proyectos().filter((p) => p.estado == 'inactivo').length);
    totalFinalizados = computed(() => this.proyectos().filter((p) => p.estado == 'finalizado').length);

    @ViewChild('dt') dt!: Table;

    constructor(
        private proyectoService: ProyectoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadProyectos();
    }

    loadProyectos() {
        this.loading.set(true);
        this.proyectoService.getAll().subscribe({
            next: (data) => {
                this.proyectos.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los proyectos.', life: 4000 });
                this.loading.set(false);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.proyecto = { estado: 'activo' };
        this.submitted = false;
        this.dialogTitle = 'Nuevo Proyecto';
        this.proyectoDialog = true;
    }

    editProyecto(p: Proyecto) {
        this.proyecto = { ...p };
        this.submitted = false;
        this.dialogTitle = 'Editar Proyecto';
        this.proyectoDialog = true;
    }

    hideDialog() {
        this.proyectoDialog = false;
        this.submitted = false;
    }

    saveProyecto() {
        this.submitted = true;

        if (!this.proyecto.nombre?.trim() || !this.proyecto.codigo?.trim() || !this.proyecto.estado) {
            return;
        }

        const payload: Partial<Proyecto> = {
            nombre: this.proyecto.nombre.trim().toUpperCase(),
            codigo: this.proyecto.codigo.trim(),
            descripcion: this.proyecto.descripcion || null,
            fecha_inicio: this.proyecto.fecha_inicio || null,
            fecha_fin: this.proyecto.fecha_fin || null,
            estado: this.proyecto.estado
        };

        this.saving.set(true);

        if (this.proyecto.id) {
            // Actualizar
            this.proyectoService.update(this.proyecto.id, payload).subscribe({
                next: (updated) => {
                    this.proyectos.update((list) => list.map((p) => (p.id == updated.id ? updated : p)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto actualizado.', life: 3000 });
                    this.proyectoDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo actualizar el proyecto.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        } else {
            // Crear
            this.proyectoService.create(payload).subscribe({
                next: (created) => {
                    this.proyectos.update((list) => [...list, created]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto creado.', life: 3000 });
                    this.proyectoDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo crear el proyecto.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        }
    }

    deleteProyecto(p: Proyecto) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el proyecto <strong>${p.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.proyectoService.delete(p.id!).subscribe({
                    next: () => {
                        this.proyectos.update((list) => list.filter((item) => item.id !== p.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Proyecto eliminado.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el proyecto.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelectedProyectos() {
        if (!this.selectedProyectos?.length) return;
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar los <strong>${this.selectedProyectos.length}</strong> proyectos seleccionados?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const requests = this.selectedProyectos!.map((p) => p.id!);
                let completed = 0;
                requests.forEach((id) => {
                    this.proyectoService.delete(id).subscribe({
                        next: () => {
                            completed++;
                            this.proyectos.update((list) => list.filter((item) => item.id !== id));
                            if (completed == requests.length) {
                                this.selectedProyectos = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Proyectos eliminados.', life: 3000 });
                            }
                        }
                    });
                });
            }
        });
    }

    exportExcel() {
        const data = this.proyectos().map((p) => ({
            Código: p.codigo,
            Nombre: p.nombre,
            Descripción: p.descripcion || '',
            'Fecha Inicio': p.fecha_inicio || '',
            'Fecha Fin': p.fecha_fin || '',
            Estado: this.getEstadoLabel(p.estado)
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyectos');

        // Ajustar ancho de columnas
        worksheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];

        XLSX.writeFile(workbook, `Proyectos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    getSeverity(estado: string): 'success' | 'warn' | 'secondary' | 'info' | 'danger' | 'contrast' {
        switch (estado) {
            case 'activo':
                return 'success';
            case 'inactivo':
                return 'warn';
            case 'finalizado':
                return 'secondary';
            default:
                return 'info';
        }
    }

    getEstadoLabel(estado: string): string {
        switch (estado) {
            case 'activo':
                return 'Activo';
            case 'inactivo':
                return 'Inactivo';
            case 'finalizado':
                return 'Finalizado';
            default:
                return estado;
        }
    }
}
