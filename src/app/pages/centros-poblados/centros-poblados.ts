import { Component, computed, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
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
import { CentroPoblado, CentroPobladoService } from '@/app/pages/service/centro-poblado.service';
import { Departamento, DepartamentoService } from '@/app/pages/service/departamento.service';
import { MunicipioSelectComponent } from '@/app/shared/components/municipio-select/municipio-select.component';
import { DepartamentoSelectComponent } from '@/app/shared/components/departamento-select/departamento-select.component';
import { EstadoSelectComponent } from '@/app/shared/components/estado-select/estado-select.component';
import { Municipio, MunicipioService } from '@/app/pages/service/municipio.service';
import { catchError, forkJoin, from, map, mergeMap, of, toArray } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-centros-poblados',
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
        MunicipioSelectComponent,
        DepartamentoSelectComponent,
        EstadoSelectComponent
    ],
    template: `
        <p-toast />

        <!-- ===== ESTADÍSTICAS ===== -->
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Centros Poblados</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-home text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalCentros() }}</span>
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
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Municipios con centros</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900">
                        <i class="pi pi-map-marker text-purple-600 dark:text-purple-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-purple-600 dark:text-purple-400">{{ totalMunicipios() }}</span>
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
                    [disabled]="!selectedCentros || !selectedCentros.length"
                />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
                <p-button label="Descargar plantilla" icon="pi pi-download" class="ml-2" outlined (onClick)="downloadTemplate()" />
                <p-button label="Cargar plantilla" icon="pi pi-upload" class="ml-2" severity="info" (onClick)="triggerFileUpload()" [loading]="uploading()" />
                <input #excelInput type="file" accept=".xlsx,.xls" class="hidden" (change)="onTemplateFileSelected($event)" />
            </ng-template>
        </p-toolbar>

        <!-- ===== TABLA ===== -->
        <p-table
            #dt
            [value]="centros()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['nombre', 'municipio.nombre', 'municipio.departamento.nombre']"
            dataKey="id"
            [(selection)]="selectedCentros"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} centros poblados"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '60rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Centros Poblados</h5>
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
                    <th pSortableColumn="municipio.departamento.nombre" style="min-width: 16rem">
                        Departamento <p-sortIcon field="municipio.departamento.nombre" />
                    </th>
                    <th pSortableColumn="municipio.nombre" style="min-width: 16rem">
                        Municipio <p-sortIcon field="municipio.nombre" />
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
                        <p-columnFilter type="text" field="nombre" placeholder="Buscar centro poblado" ariaLabel="Filter Nombre" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="municipio.departamento.nombre" placeholder="Buscar departamento" ariaLabel="Filter Departamento" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="municipio.nombre" placeholder="Buscar municipio" ariaLabel="Filter Municipio" />
                    </th>
                    <th>
                        <p-columnFilter type="numeric" field="estado_id" placeholder="Ej. 1" ariaLabel="Filter Estado ID" />
                    </th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-cp>
                <tr>
                    <td style="width: 3rem">
                        <p-tableCheckbox [value]="cp" />
                    </td>
                    <td>{{ cp.id }}</td>
                    <td class="uppercase">{{ cp.nombre }}</td>
                    <td class="uppercase">{{ cp.municipio?.departamento?.nombre }}</td>
                    <td class="uppercase">{{ cp.municipio?.nombre }}</td>
                    <td>{{ cp.estado_id }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editCentro(cp)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteCentro(cp)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="7" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron centros poblados.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <!-- ===== DIALOG CREAR / EDITAR ===== -->
        <p-dialog [(visible)]="centroDialog" [style]="{ width: '460px' }" [header]="dialogTitle" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-5 pt-2">

                 <!-- Departamento -->
                    <div>
                        <label for="dep_id" class="block font-semibold mb-2">
                            Departamento <span class="text-red-500">*</span>
                        </label>
                        <app-departamento-select
                            [(ngModel)]="selectedDepartamentoId"
                            (ngModelChange)="onDepartamentoChange($event)"
                        />
                        @if (submitted && !selectedDepartamentoId) {
                            <small class="text-red-500">El departamento es requerido.</small>
                        }
                    </div>

                    <!-- Municipio -->
                    <div>
                        <label for="municipio_id" class="block font-semibold mb-2">
                            Municipio <span class="text-red-500">*</span>
                        </label>
                        <app-municipio-select
                            [(ngModel)]="centro.municipio_id"
                            [departamentoId]="selectedDepartamentoId"
                            [class.opacity-50]="!selectedDepartamentoId"
                        />
                        @if (submitted && !centro.municipio_id) {
                            <small class="text-red-500">El municipio es requerido.</small>
                        }
                    </div>
                    <!-- Nombre -->
                    <div>
                        <label for="nombre" class="block font-semibold mb-2">
                            Nombre <span class="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            pInputText
                            id="nombre"
                            [(ngModel)]="centro.nombre"
                            placeholder="EJ. VEREDA EL CAIRO"
                            maxlength="150"
                            style="text-transform: uppercase"
                            fluid
                            autofocus
                        />
                        @if (submitted && !centro.nombre) {
                            <small class="text-red-500">El nombre es requerido.</small>
                        }
                    </div>



                    <!-- Estado -->
                    <div>
                        <label for="estado_id" class="block font-semibold mb-2">Estado ID</label>
                        <app-estado-select [(ngModel)]="centro.estado_id" />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveCentro()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class CentrosPoblados implements OnInit {
    centroDialog = false;
    dialogTitle = 'Nuevo Centro Poblado';

    centros = signal<CentroPoblado[]>([]);
    loading = signal(false);
    saving = signal(false);
    uploading = signal(false);

    centro: Partial<CentroPoblado> = {};
    selectedDepartamentoId: number | null = null;
    selectedCentros: CentroPoblado[] | null = null;
    submitted = false;

    totalCentros = computed(() => this.centros().length);
    totalActivos = computed(() => this.centros().filter((c) => c.estado_id === 1).length);
    totalMunicipios = computed(() => new Set(this.centros().map((c) => c.municipio_id)).size);

    @ViewChild('dt') dt!: Table;
    @ViewChild('excelInput') excelInput!: ElementRef<HTMLInputElement>;

    constructor(
        private centroPobladoService: CentroPobladoService,
        private departamentoService: DepartamentoService,
        private municipioService: MunicipioService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadCentros();
    }

    loadCentros() {
        this.loading.set(true);
        this.centroPobladoService.getAll().subscribe({
            next: (data) => {
                this.centros.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los centros poblados.', life: 4000 });
                this.loading.set(false);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.centro = { estado_id: 1 };
        this.selectedDepartamentoId = null;
        this.submitted = false;
        this.dialogTitle = 'Nuevo Centro Poblado';
        this.centroDialog = true;
    }

    editCentro(cp: CentroPoblado) {
        this.centro = { ...cp };
        this.selectedDepartamentoId = cp.municipio?.departamento_id ?? null;
        this.submitted = false;
        this.dialogTitle = 'Editar Centro Poblado';
        this.centroDialog = true;
    }

    onDepartamentoChange(_id: number | null) {
        this.centro.municipio_id = undefined;
    }

    hideDialog() {
        this.centroDialog = false;
        this.submitted = false;
        this.selectedDepartamentoId = null;
    }

    saveCentro() {
        this.submitted = true;
        if (!this.centro.nombre?.trim() || !this.selectedDepartamentoId || !this.centro.municipio_id) return;

        const payload: Partial<CentroPoblado> = {
            nombre: this.centro.nombre.trim().toUpperCase(),
            municipio_id: this.centro.municipio_id,
            estado_id: this.centro.estado_id ?? 1
        };

        this.saving.set(true);

        if (this.centro.id) {
            this.centroPobladoService.update(this.centro.id, payload).subscribe({
                next: (updated) => {
                    this.centros.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Centro poblado actualizado.', life: 3000 });
                    this.centroDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo actualizar el centro poblado.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        } else {
            this.centroPobladoService.create(payload).subscribe({
                next: (created) => {
                    this.centros.update((list) => [...list, created]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Centro poblado creado.', life: 3000 });
                    this.centroDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo crear el centro poblado.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.saving.set(false);
                }
            });
        }
    }

    deleteCentro(cp: CentroPoblado) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar <strong>${cp.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.centroPobladoService.delete(cp.id!).subscribe({
                    next: () => {
                        this.centros.update((list) => list.filter((c) => c.id !== cp.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Centro poblado eliminado.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el centro poblado.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelected() {
        if (!this.selectedCentros?.length) return;
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar los <strong>${this.selectedCentros.length}</strong> centros poblados seleccionados?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.selectedCentros!.map((c) => c.id!);
                let completed = 0;
                ids.forEach((id) => {
                    this.centroPobladoService.delete(id).subscribe({
                        next: () => {
                            completed++;
                            this.centros.update((list) => list.filter((c) => c.id !== id));
                            if (completed === ids.length) {
                                this.selectedCentros = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Centros poblados eliminados.', life: 3000 });
                            }
                        }
                    });
                });
            }
        });
    }

    exportExcel() {
        const data = this.centros().map((c) => ({
            ID: c.id,
            Nombre: c.nombre,
            Municipio: c.municipio?.nombre ?? '',
            'Estado ID': c.estado_id
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CentrosPoblados');
        worksheet['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 28 }, { wch: 12 }];
        XLSX.writeFile(workbook, `CentrosPoblados_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    downloadTemplate() {
        forkJoin({
            departamentos: this.departamentoService.getAll(),
            municipios: this.municipioService.getAll()
        }).subscribe({
            next: ({ departamentos, municipios }) => {
                const templateData = [
                    { departamento_id: '', municipio_id: '', nombre_centro_poblado: '' },
                    { departamento_id: '', municipio_id: '', nombre_centro_poblado: '' }
                ];

                const departamentoData = departamentos
                    .slice()
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                    .map((d) => ({ id: d.id ?? '', nombre: d.nombre }));

                const municipioData = municipios
                    .slice()
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                    .map((m) => ({
                        id: m.id ?? '',
                        nombre: m.nombre,
                        departamento_id: m.departamento_id,
                        departamento_nombre: m.departamento?.nombre ?? ''
                    }));

                const workbook = XLSX.utils.book_new();

                const plantillaSheet = XLSX.utils.json_to_sheet(templateData);
                plantillaSheet['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 35 }];
                XLSX.utils.book_append_sheet(workbook, plantillaSheet, 'Plantilla');

                const departamentosSheet = XLSX.utils.json_to_sheet(departamentoData);
                departamentosSheet['!cols'] = [{ wch: 10 }, { wch: 35 }];
                XLSX.utils.book_append_sheet(workbook, departamentosSheet, 'Departamentos');

                const municipiosSheet = XLSX.utils.json_to_sheet(municipioData);
                municipiosSheet['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 18 }, { wch: 35 }];
                XLSX.utils.book_append_sheet(workbook, municipiosSheet, 'Municipios');

                XLSX.writeFile(workbook, `Plantilla_Centros_Poblados_${new Date().toISOString().slice(0, 10)}.xlsx`);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo generar la plantilla. Intenta nuevamente.',
                    life: 4000
                });
            }
        });
    }

    triggerFileUpload() {
        this.excelInput?.nativeElement.click();
    }

    onTemplateFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.uploading.set(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];

                if (!firstSheetName) {
                    throw new Error('El archivo no contiene hojas.');
                }

                const sheet = workbook.Sheets[firstSheetName];
                const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

                this.processTemplateRows(rawRows);
            } catch (error) {
                const detail = error instanceof Error ? error.message : 'No se pudo leer el archivo Excel.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 4500 });
                this.uploading.set(false);
                input.value = '';
            }
        };

        reader.onerror = () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo leer el archivo seleccionado.', life: 4500 });
            this.uploading.set(false);
            input.value = '';
        };

        reader.readAsArrayBuffer(file);
    }

    private processTemplateRows(rawRows: Record<string, unknown>[]) {
        const rows = rawRows
            .map((row, index) => this.normalizeTemplateRow(row, index + 2))
            .filter((row): row is ParsedTemplateRow => row !== null);

        if (!rows.length) {
            this.uploading.set(false);
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin datos',
                detail: 'La plantilla no contiene filas válidas para procesar.',
                life: 4000
            });
            return;
        }

        forkJoin({
            departamentos: this.departamentoService.getAll(),
            municipios: this.municipioService.getAll()
        }).subscribe({
            next: ({ departamentos, municipios }) => this.uploadRows(rows, departamentos, municipios),
            error: () => {
                this.uploading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron validar departamentos y municipios antes de cargar.',
                    life: 4500
                });
            }
        });
    }

    private uploadRows(rows: ParsedTemplateRow[], departamentos: Departamento[], municipios: Municipio[]) {
        const validDepartamentos = new Set(departamentos.map((d) => d.id).filter((id): id is number => typeof id === 'number'));
        const municipiosMap = new Map<number, Municipio>(municipios.filter((m) => typeof m.id === 'number').map((m) => [m.id as number, m]));

        const invalidRows: string[] = [];
        const validRows = rows.filter((row) => {
            if (!validDepartamentos.has(row.departamento_id)) {
                invalidRows.push(`Fila ${row.rowNumber}: departamento_id ${row.departamento_id} no existe.`);
                return false;
            }

            const municipio = municipiosMap.get(row.municipio_id);
            if (!municipio) {
                invalidRows.push(`Fila ${row.rowNumber}: municipio_id ${row.municipio_id} no existe.`);
                return false;
            }

            if (municipio.departamento_id !== row.departamento_id) {
                invalidRows.push(`Fila ${row.rowNumber}: municipio_id ${row.municipio_id} no pertenece al departamento_id ${row.departamento_id}.`);
                return false;
            }

            return true;
        });

        if (!validRows.length) {
            this.uploading.set(false);
            this.messageService.add({
                severity: 'error',
                summary: 'Validación fallida',
                detail: invalidRows.slice(0, 2).join(' ') || 'No hay filas válidas para cargar.',
                life: 6000
            });
            return;
        }

        from(validRows)
            .pipe(
                mergeMap(
                    (row) =>
                        this.centroPobladoService
                            .create({
                                municipio_id: row.municipio_id,
                                nombre: row.nombre_centro_poblado.toUpperCase(),
                                estado_id: 1
                            })
                            .pipe(
                                map((created) => ({ status: 'ok' as const, row, created })),
                                catchError((err) =>
                                    of({
                                        status: 'error' as const,
                                        row,
                                        errorMessage: err?.error?.message || 'Error al crear centro poblado.'
                                    })
                                )
                            ),
                    4
                ),
                toArray()
            )
            .subscribe({
                next: (results) => {
                    const created = results.filter((r) => r.status === 'ok').map((r) => r.created);
                    const failed = results.filter((r) => r.status === 'error');

                    if (created.length) {
                        this.centros.update((list) => [...list, ...created]);
                    }

                    if (created.length) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Carga completada',
                            detail: `Se cargaron ${created.length} centros poblados.`,
                            life: 4000
                        });
                    }

                    if (invalidRows.length || failed.length) {
                        const invalidText = invalidRows.length ? invalidRows[0] : '';
                        const failedText = failed.length
                            ? `Fila ${failed[0].row.rowNumber}: ${failed[0].errorMessage}`
                            : '';

                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Registros omitidos',
                            detail: [invalidText, failedText].filter(Boolean).join(' '),
                            life: 7000
                        });
                    }

                    if (!created.length && !failed.length && invalidRows.length) {
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Sin cargas',
                            detail: 'No se cargaron registros por errores de validación.',
                            life: 5000
                        });
                    }

                    this.uploading.set(false);
                    if (this.excelInput?.nativeElement) {
                        this.excelInput.nativeElement.value = '';
                    }
                    this.loadCentros();
                },
                error: () => {
                    this.uploading.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Ocurrió un error inesperado durante la carga masiva.',
                        life: 4500
                    });
                    if (this.excelInput?.nativeElement) {
                        this.excelInput.nativeElement.value = '';
                    }
                }
            });
    }

    private normalizeTemplateRow(row: Record<string, unknown>, rowNumber: number): ParsedTemplateRow | null {
        const keyMap = new Map<string, unknown>();
        Object.entries(row).forEach(([key, value]) => {
            keyMap.set(this.normalizeHeader(key), value);
        });

        const depRaw = keyMap.get('departamento_id');
        const munRaw = keyMap.get('municipio_id');
        const nombreRaw = keyMap.get('nombre_centro_poblado') ?? keyMap.get('nombre');

        const departamento_id = this.toNumber(depRaw);
        const municipio_id = this.toNumber(munRaw);
        const nombre_centro_poblado = String(nombreRaw ?? '').trim();

        const isEmptyRow = !departamento_id && !municipio_id && !nombre_centro_poblado;
        if (isEmptyRow) return null;

        if (!departamento_id || !municipio_id || !nombre_centro_poblado) {
            throw new Error(`Fila ${rowNumber}: debe incluir departamento_id, municipio_id y nombre_centro_poblado.`);
        }

        return { rowNumber, departamento_id, municipio_id, nombre_centro_poblado };
    }

    private normalizeHeader(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_');
    }

    private toNumber(value: unknown): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const parsed = Number(value.trim());
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    }
}

interface ParsedTemplateRow {
    rowNumber: number;
    departamento_id: number;
    municipio_id: number;
    nombre_centro_poblado: string;
}
