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
import { Hogar, HogarService } from '@/app/pages/service/hogar.service';
import { DepartamentoSelectComponent } from '@/app/shared/components/departamento-select/departamento-select.component';
import { MunicipioSelectComponent } from '@/app/shared/components/municipio-select/municipio-select.component';
import { CentroPobladoSelectComponent } from '@/app/shared/components/centro-poblado-select/centro-poblado-select.component';
import { SexoSelectComponent } from '../../shared/components/sexo-select/sexo-select.component';
import { TipoViviendaSelectComponent } from '../../shared/components/tipo-vivienda-select/tipo-vivienda-select.component';
import * as XLSX from 'xlsx';

@Component({
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
        MunicipioSelectComponent,
        CentroPobladoSelectComponent,
        SexoSelectComponent,
        TipoViviendaSelectComponent
    ],
    template: `
        <p-toast />

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Hogares</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-home text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalHogares() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Con Centro Poblado</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                        <i class="pi pi-check-circle text-green-600 dark:text-green-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-green-600 dark:text-green-400">{{ totalConCentro() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Promedio Edad</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900">
                        <i class="pi pi-calendar text-yellow-600 dark:text-yellow-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{{ promedioEdad() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Con Salario</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900">
                        <i class="pi pi-wallet text-purple-600 dark:text-purple-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ promedioIngreso() }}</span>
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
                    [disabled]="!selectedHogares || !selectedHogares.length"
                />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="hogares()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['cedula', 'nombre_persona', 'direccion', 'departamento.nombre', 'municipio.nombre', 'centro_poblado.nombre']"
            dataKey="id"
            [(selection)]="selectedHogares"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} hogares"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '76rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Hogares</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <th pSortableColumn="id" style="min-width: 6rem">ID <p-sortIcon field="id" /></th>
                    <th pSortableColumn="nombre_persona" style="min-width: 14rem">Nombre Persona <p-sortIcon field="nombre_persona" /></th>
                    <th pSortableColumn="cedula" style="min-width: 10rem">Cédula <p-sortIcon field="cedula" /></th>
                     <th pSortableColumn="telefono" style="min-width: 10rem">Teléfono <p-sortIcon field="telefono" /></th>
                    <th pSortableColumn="manzana" style="min-width: 14rem">Manzana <p-sortIcon field="manzana" /></th>
                    <th pSortableColumn="predio" style="min-width: 14rem">Predio <p-sortIcon field="predio" /></th>
                    <th pSortableColumn="departamento.nombre" style="min-width: 12rem">Departamento <p-sortIcon field="departamento.nombre" /></th>
                    <th pSortableColumn="municipio.nombre" style="min-width: 12rem">Municipio <p-sortIcon field="municipio.nombre" /></th>
                    <th pSortableColumn="centro_poblado.nombre" style="min-width: 12rem">Centro Poblado <p-sortIcon field="centro_poblado.nombre" /></th>

                    <th style="min-width: 9rem"></th>
                </tr>
                <tr>
                    <th></th>
                    <th></th>
                    <th><p-columnFilter type="text" field="nombre_persona" placeholder="Buscar nombre" /></th>
                    <th><p-columnFilter type="text" field="cedula" placeholder="Buscar cédula" /></th>

                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-h>
                <tr>
                    <td style="width: 3rem"><p-tableCheckbox [value]="h" /></td>
                    <td>{{ h.id }}</td>
                                        <td class="uppercase">{{ h.nombre_persona || '-' }}</td>
                                        <td class="uppercase">{{ h.cedula }}</td>
                                                                                <td class="uppercase">{{ h.telefono || '-' }}</td>
                                        <td class="uppercase">{{ h.manzana }}</td>
                                         <td class="uppercase">{{ h.predio }}</td>
                    <td class="uppercase">{{ h.departamento?.nombre || ('ID ' + h.departamento_id) }}</td>
                    <td class="uppercase">{{ h.municipio?.nombre || ('ID ' + h.municipio_id) }}</td>
                    <td class="uppercase">{{ h.centro_poblado?.nombre || (h.centro_poblado_id ? ('ID ' + h.centro_poblado_id) : '-') }}</td>


                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editHogar(h)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteHogar(h)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="10" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron hogares.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="hogarDialog" [style]="{ width: '820px' }" [header]="dialogTitle" [modal]="true" [blockScroll]="false" (onShow)="onDialogShow()">
            <ng-template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label class="block font-semibold mb-2">Departamento <span class="text-red-500">*</span></label>
                        <app-departamento-select [(ngModel)]="selectedDepartamentoId" (ngModelChange)="onDepartamentoChange($event)" />
                        @if (submitted && !selectedDepartamentoId) {
                            <small class="text-red-500">El departamento es requerido.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Municipio <span class="text-red-500">*</span></label>
                        <app-municipio-select   [(ngModel)]="hogar.municipio_id" [departamentoId]="selectedDepartamentoId" (ngModelChange)="onMunicipioChange($event)" />
                        @if (submitted && !hogar.municipio_id) {
                            <small class="text-red-500">El municipio es requerido.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Centro Poblado</label>
                        <app-centro-poblado-select [(ngModel)]="hogar.centro_poblado_id" [municipioId]="hogar.municipio_id ?? null" />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Nombre Persona <span class="text-red-500">*</span></label>
                        <input pInputText [(ngModel)]="hogar.nombre_persona" (ngModelChange)="hogar.nombre_persona = toUpperText($event)" placeholder="Ej. JUAN PEREZ" maxlength="150" fluid />
                        @if (submitted && !hogar.nombre_persona?.trim()) {
                            <small class="text-red-500">El nombre de la persona es requerido.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Cédula <span class="text-red-500">*</span></label>
                        <input pInputText [(ngModel)]="hogar.cedula" (ngModelChange)="hogar.cedula = toUpperText($event)" placeholder="Ej. 12345678" maxlength="30" fluid />
                        @if (submitted && !hogar.cedula?.trim()) {
                            <small class="text-red-500">La cédula es requerida.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Manzana</label>
                        <input pInputText [(ngModel)]="hogar.manzana" (ngModelChange)="hogar.manzana = toUpperText($event)" placeholder="Ej. MZ-01" maxlength="100" fluid />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Predio</label>
                        <input pInputText [(ngModel)]="hogar.predio" (ngModelChange)="hogar.predio = toUpperText($event)" placeholder="Ej. PR-01" maxlength="100" fluid />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Teléfono</label>
                        <input pInputText [(ngModel)]="hogar.telefono" (ngModelChange)="hogar.telefono = toUpperText($event)" maxlength="20" fluid />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Estrato</label>
                        <input pInputText [(ngModel)]="hogar.estrato" (ngModelChange)="hogar.estrato = toUpperText($event)" maxlength="20" fluid />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Tipo Vivienda</label>
                        <app-tipo-vivienda-select [(ngModel)]="hogar.tipo_vivienda" />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Edad</label>
                        <input pInputText [(ngModel)]="hogar.edad" maxlength="3" type="number" fluid />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Sexo</label>
                        <app-sexo-select [(ngModel)]="hogar.sexo" />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Ocupación</label>
                        <input pInputText [(ngModel)]="hogar.ocupacion" (ngModelChange)="hogar.ocupacion = toUpperText($event)" maxlength="100" fluid />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Salario</label>
                        <input pInputText [(ngModel)]="hogar.salario" (ngModelChange)="hogar.salario = toUpperText($event)" maxlength="100" fluid />
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveHogar()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Hogares implements OnInit {
    hogarDialog = false;
    dialogTitle = 'Nuevo Hogar';

    hogares = signal<Hogar[]>([]);
    loading = signal(false);
    saving = signal(false);

    hogar: Partial<Hogar> = {};
    selectedDepartamentoId: number | null = null;
    selectedHogares: Hogar[] | null = null;
    submitted = false;

    totalHogares = computed(() => this.hogares().length);
    totalConCentro = computed(() => this.hogares().filter((h) => !!h.centro_poblado_id).length);
    promedioEdad = computed(() => {
        const edades = this.hogares().map((h) => Number(h.edad)).filter((n) => Number.isFinite(n) && n > 0);
        if (!edades.length) return '-';
        return (edades.reduce((acc, n) => acc + n, 0) / edades.length).toFixed(1);
    });
    promedioIngreso = computed(() => {
        const count = this.hogares().filter((h) => !!h.salario).length;
        return count.toString();
    });

    @ViewChild('dt') dt!: Table;
    @ViewChild(DepartamentoSelectComponent) departamentoSelectComponent?: DepartamentoSelectComponent;
    @ViewChild(MunicipioSelectComponent) municipioSelectComponent?: MunicipioSelectComponent;
    @ViewChild(SexoSelectComponent) sexoSelectComponent?: SexoSelectComponent;
    @ViewChild(TipoViviendaSelectComponent) tipoViviendaSelectComponent?: TipoViviendaSelectComponent;

    private refreshCatalogSelectsOnShow = false;
    private syncLocationSelectsOnShow = false;

    constructor(
        private hogarService: HogarService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadHogares();
        this.refreshCatalogSelectsOnShow = false;
    }

    loadHogares() {
        this.loading.set(true);
        this.hogarService.getAll().subscribe({
            next: (data) => {
                this.hogares.set(data.map((h) => this.normalizeHogarTextFields(h) as Hogar));
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los hogares.', life: 4000 });
                this.loading.set(false);
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.hogar = {};
        this.selectedDepartamentoId = null;
        this.submitted = false;
        this.dialogTitle = 'Nuevo Hogar';
        this.refreshCatalogSelectsOnShow = false;
        this.hogarDialog = true;
        this.syncLocationSelectsOnShow = !this.syncLocationSelects();
    }

    editHogar(h: Hogar) {
        this.hogar = this.normalizeHogarTextFields({ ...h });
        this.selectedDepartamentoId = h.departamento_id;
        this.submitted = false;
        this.dialogTitle = 'Editar Hogar';
        this.refreshCatalogSelectsOnShow = true;
        this.hogarDialog = true;
        this.syncLocationSelectsOnShow = !this.syncLocationSelects();
    }

    onDialogShow() {
        if (this.syncLocationSelectsOnShow) {
            this.syncLocationSelectsOnShow = !this.syncLocationSelects();
        }

        if (this.refreshCatalogSelectsOnShow) {
            this.sexoSelectComponent?.setSelectedValue(this.hogar.sexo ?? null);
            this.sexoSelectComponent?.reloadOptions();
            this.tipoViviendaSelectComponent?.setSelectedValue(this.hogar.tipo_vivienda ?? null);
            this.tipoViviendaSelectComponent?.reloadOptions();
            this.refreshCatalogSelectsOnShow = false;
        }
    }

    private syncLocationSelects(): boolean {
        if (!this.departamentoSelectComponent || !this.municipioSelectComponent) {
            return false;
        }

        this.departamentoSelectComponent.setSelectedDepartamento(this.selectedDepartamentoId);
        this.municipioSelectComponent.setSelectedMunicipio(this.hogar.municipio_id ?? null);
        return true;
    }

    onDepartamentoChange(_departamentoId: number | null) {
        this.hogar.municipio_id = undefined;
        this.hogar.centro_poblado_id = undefined;
    }

    onMunicipioChange(_municipioId: number | null) {
        this.hogar.centro_poblado_id = undefined;
    }

    hideDialog() {
        this.hogarDialog = false;
        this.submitted = false;
        this.selectedDepartamentoId = null;
        this.syncLocationSelectsOnShow = false;
    }

    saveHogar() {
        this.submitted = true;

        this.hogar = this.normalizeHogarTextFields(this.hogar);

        if (!this.selectedDepartamentoId || !this.hogar.municipio_id || !this.hogar.nombre_persona?.trim() || !this.hogar.cedula?.trim()) {
            return;
        }

        const payload = this.cleanPayload({
            departamento_id: this.selectedDepartamentoId,
            municipio_id: this.hogar.municipio_id,
            centro_poblado_id: this.hogar.centro_poblado_id,
            nombre_persona: this.hogar.nombre_persona.trim(),
            cedula: this.hogar.cedula.trim(),
            manzana: this.hogar.manzana?.trim(),
            predio: this.hogar.predio?.trim(),
            telefono: this.hogar.telefono?.trim(),
            estrato: this.hogar.estrato?.trim(),
            tipo_vivienda: this.hogar.tipo_vivienda?.trim(),
            edad: this.hogar.edad,
            sexo: this.hogar.sexo?.trim(),
            ocupacion: this.hogar.ocupacion?.trim(),
            salario: this.hogar.salario?.trim()
        });

        this.saving.set(true);

        if (this.hogar.id) {
            this.hogarService.update(this.hogar.id, payload).subscribe({
                next: (updated) => {
                    const normalizedUpdated = this.normalizeHogarTextFields(updated) as Hogar;
                    this.hogares.update((list) => list.map((h) => (h.id == normalizedUpdated.id ? normalizedUpdated : h)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Hogar actualizado.', life: 3000 });
                    this.hogarDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = this.getErrorMessage(err, 'No se pudo actualizar el hogar.');
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4500 });
                    this.saving.set(false);
                }
            });
        } else {
            this.hogarService.create(payload).subscribe({
                next: (created) => {
                    this.hogares.update((list) => [...list, this.normalizeHogarTextFields(created) as Hogar]);
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Hogar creado.', life: 3000 });
                    this.hogarDialog = false;
                    this.saving.set(false);
                },
                error: (err) => {
                    const msg = this.getErrorMessage(err, 'No se pudo crear el hogar.');
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4500 });
                    this.saving.set(false);
                }
            });
        }
    }

    deleteHogar(h: Hogar) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el hogar con cédula <strong>${h.cedula}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.hogarService.delete(h.id!).subscribe({
                    next: () => {
                        this.hogares.update((list) => list.filter((item) => item.id !== h.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Hogar eliminado.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el hogar.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelected() {
        if (!this.selectedHogares?.length) return;
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar los <strong>${this.selectedHogares.length}</strong> hogares seleccionados?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.selectedHogares!.map((h) => h.id!);
                let completed = 0;
                ids.forEach((id) => {
                    this.hogarService.delete(id).subscribe({
                        next: () => {
                            completed++;
                            this.hogares.update((list) => list.filter((item) => item.id !== id));
                            if (completed == ids.length) {
                                this.selectedHogares = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Hogares eliminados.', life: 3000 });
                            }
                        }
                    });
                });
            }
        });
    }

    exportExcel() {
        const data = this.hogares().map((h) => ({
            ID: h.id,
            Cedula: h.cedula,
            Nombre: h.nombre_persona ?? '',
            Manzana: h.manzana ?? '',
            Predio: h.predio ?? '',
            'Departamento ID': h.departamento_id,
            'Municipio ID': h.municipio_id,
            'Centro Poblado ID': h.centro_poblado_id ?? '',
            Telefono: h.telefono ?? '',
            Estrato: h.estrato ?? '',
            'Tipo Vivienda': h.tipo_vivienda ?? '',
            Edad: h.edad ?? '',
            Sexo: h.sexo ?? '',
            Ocupacion: h.ocupacion ?? '',
            Salario: h.salario ?? ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Hogares');
        worksheet['!cols'] = [
            { wch: 8 },
            { wch: 16 },
            { wch: 24 },
            { wch: 28 },
            { wch: 14 },
            { wch: 12 },
            { wch: 16 },
            { wch: 14 },
            { wch: 10 },
            { wch: 16 },
            { wch: 8 },
            { wch: 8 },
            { wch: 16 },
            { wch: 14 }
        ];
        XLSX.writeFile(workbook, `Hogares_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    private cleanPayload(payload: Partial<Hogar>): Partial<Hogar> {
        const cleaned: Partial<Hogar> = {};
        Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                (cleaned as any)[key] = value;
            }
        });
        return cleaned;
    }

    toUpperText(value: unknown): string {
        return typeof value == 'string' ? value.toUpperCase() : '';
    }

    private normalizeHogarTextFields(hogar: Partial<Hogar>): Partial<Hogar> {
        return {
            ...hogar,
            nombre_persona: this.toUpperText(hogar.nombre_persona),
            cedula: this.toUpperText(hogar.cedula),
            manzana: hogar.manzana !== undefined && hogar.manzana !== null ? this.toUpperText(hogar.manzana) : hogar.manzana,
            predio: hogar.predio !== undefined && hogar.predio !== null ? this.toUpperText(hogar.predio) : hogar.predio,
            telefono: hogar.telefono !== undefined && hogar.telefono !== null ? this.toUpperText(hogar.telefono) : hogar.telefono,
            estrato: hogar.estrato !== undefined && hogar.estrato !== null ? this.toUpperText(hogar.estrato) : hogar.estrato,
            tipo_vivienda: hogar.tipo_vivienda !== undefined && hogar.tipo_vivienda !== null ? this.toUpperText(hogar.tipo_vivienda) : hogar.tipo_vivienda,
            sexo: hogar.sexo !== undefined && hogar.sexo !== null ? this.toUpperText(hogar.sexo) : hogar.sexo,
            ocupacion: hogar.ocupacion !== undefined && hogar.ocupacion !== null ? this.toUpperText(hogar.ocupacion) : hogar.ocupacion
        };
    }

    private getErrorMessage(err: any, fallback: string): string {
        const serverMessage = err?.error?.message;
        const validation = err?.error?.errors;

        if (validation && typeof validation == 'object') {
            const first = Object.values(validation)[0] as string[] | undefined;
            if (first?.length) return first[0];
        }

        return serverMessage || fallback;
    }
}
