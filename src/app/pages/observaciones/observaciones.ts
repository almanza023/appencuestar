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
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FotografiaObservacion, FotografiaObservacionService } from '@/app/pages/service/fotografia-observacion.service';
import { Observacion, ObservacionService } from '@/app/pages/service/observacion.service';
import { DepartamentoSelectComponent } from '@/app/shared/components/departamento-select/departamento-select.component';
import { MunicipioSelectComponent } from '@/app/shared/components/municipio-select/municipio-select.component';
import { CentroPobladoSelectComponent } from '@/app/shared/components/centro-poblado-select/centro-poblado-select.component';
import { EncuestadorSelectComponent } from '@/app/shared/components/encuestador-select/encuestador-select.component';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-observaciones',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        TooltipModule,
        DepartamentoSelectComponent,
        MunicipioSelectComponent,
        CentroPobladoSelectComponent,
        EncuestadorSelectComponent
    ],
    template: `
        <p-toast />

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Observaciones</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-comment text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalObservaciones() }}</span>
            </div>

            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Fotografías</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900">
                        <i class="pi pi-image text-emerald-600 dark:text-emerald-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{{ totalFotografias() }}</span>
            </div>

            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Con Manzana/Predio</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900">
                        <i class="pi pi-map-marker text-amber-600 dark:text-amber-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-amber-600 dark:text-amber-400">{{ totalUbicadas() }}</span>
            </div>

            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Estados distintos</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900">
                        <i class="pi pi-tags text-violet-600 dark:text-violet-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-violet-600 dark:text-violet-400">{{ totalEstadosUsados() }}</span>
            </div>
        </div>

        <p-toolbar styleClass="mb-4">
            <ng-template #start>
                <p-button label="Nueva observación" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNewObservacion()" />
                <p-button
                    severity="secondary"
                    label="Eliminar seleccionadas"
                    icon="pi pi-trash"
                    outlined
                    (onClick)="deleteSelectedObservaciones()"
                    [disabled]="!selectedObservaciones || !selectedObservaciones.length"
                />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dtObservaciones
            [value]="observaciones()"
            [rows]="8"
            [paginator]="true"
            [globalFilterFields]="['id', 'encuesta_id', 'encuestador_id', 'manzana', 'predio', 'descripcion', 'estado_id']"
            dataKey="id"
            [(selection)]="selectedObservaciones"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} observaciones"
            [rowsPerPageOptions]="[8, 16, 32]"
            [loading]="loadingObservaciones()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '76rem' }"
            styleClass="mb-8"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between gap-3">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Observaciones</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilterObservaciones($event)" placeholder="Buscar observaciones..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <th pSortableColumn="id" style="min-width: 6rem">ID <p-sortIcon field="id" /></th>

                    <th pSortableColumn="encuestador_id" style="min-width: 10rem">Encuestador <p-sortIcon field="encuestador_id" /></th>
                    <th pSortableColumn="departamento" style="min-width: 11rem">Departamento <p-sortIcon field="departamento" /></th>
                    <th pSortableColumn="municipio" style="min-width: 11rem">Municipio <p-sortIcon field="municipio" /></th>
                    <th pSortableColumn="centro_poblado" style="min-width: 13rem">Centro Poblado <p-sortIcon field="centro_poblado" /></th>
                    <th pSortableColumn="manzana" style="min-width: 9rem">Manzana <p-sortIcon field="manzana" /></th>
                    <th pSortableColumn="predio" style="min-width: 9rem">Predio <p-sortIcon field="predio" /></th>
                    <th pSortableColumn="descripcion" style="min-width: 22rem">Descripción <p-sortIcon field="descripcion" /></th>
                    <th pSortableColumn="created_at" style="min-width: 13rem">Fecha Sincronización <p-sortIcon field="created_at" /></th>
                    <th pSortableColumn="estado_id" style="min-width: 8rem">Estado <p-sortIcon field="estado_id" /></th>
                    <th style="min-width: 9rem"></th>
                </tr>
                <tr>
                    <th></th>
                    <th><p-columnFilter type="numeric" field="id" placeholder="ID" /></th>

                    <th><p-columnFilter type="numeric" field="encuestador_id" placeholder="Encuestador" /></th>
                    <th><p-columnFilter type="text" field="departamento.nombre" placeholder="Departamento" /></th>
                    <th><p-columnFilter type="text" field="municipio.nombre" placeholder="Municipio" /></th>
                    <th><p-columnFilter type="text" field="centro_poblado.nombre" placeholder="Centro Poblado" /></th>
                    <th><p-columnFilter type="text" field="manzana" placeholder="Manzana" /></th>
                    <th><p-columnFilter type="text" field="predio" placeholder="Predio" /></th>
                    <th></th>

                    <th><p-columnFilter type="numeric" field="estado_id" placeholder="Estado" /></th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-o>
                <tr>
                    <td style="width: 3rem"><p-tableCheckbox [value]="o" /></td>
                    <td>{{ o.id }}</td>

                    <td>{{ o.encuestador?.nombres+ ' ' + o.encuestador?.apellidos }}</td>
                    <td>{{ o.departamento?.nombre || '-' }}</td>
                    <td>{{ o.municipio?.nombre || '-' }}</td>
                    <td>{{ o.centro_poblado?.nombre || '-' }}</td>
                    <td class="uppercase">{{ o.manzana || '-' }}</td>
                    <td class="uppercase">{{ o.predio || '-' }}</td>
                    <td>{{ o.descripcion }}</td>
                    <td>{{ formatFechaSincronizacion(o.created_at) }}</td>
                    <td>{{ o.estado?.nombre || '' }}</td>
                    <td>
                        <p-button icon="pi pi-images" class="mr-2" severity="help" [rounded]="true" [outlined]="true" (click)="openFotografiasTablaDialog(o)" pTooltip="Ver fotografías" tooltipPosition="top" />
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editObservacion(o)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteObservacion(o)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="12" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron observaciones.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="fotografiasTablaDialog" [style]="{ width: '1100px' }" [header]="fotografiasDialogTitle()" [modal]="true" [maximizable]="true" [blockScroll]="false">
            <ng-template #content>
                <p-toolbar styleClass="mb-4">
                    <ng-template #start>
                        <p-button label="Nueva fotografía" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNewFotografiaByObservacion()" [disabled]="!selectedObservacionFotos" />
                        <p-button
                            severity="secondary"
                            label="Eliminar seleccionadas"
                            icon="pi pi-trash"
                            outlined
                            (onClick)="deleteSelectedFotografias()"
                            [disabled]="!selectedFotografias || !selectedFotografias.length"
                        />
                    </ng-template>
                </p-toolbar>

                <p-table
                    #dtFotografias
                    [value]="fotografiasPorObservacion()"
                    [rows]="8"
                    [paginator]="true"
                    [globalFilterFields]="['id', 'observacion_id', 'ruta', 'estado_id']"
                    dataKey="id"
                    [(selection)]="selectedFotografias"
                    [rowHover]="true"
                    [showCurrentPageReport]="true"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} fotografías"
                    [rowsPerPageOptions]="[8, 16, 32]"
                    [loading]="loadingFotografias()"
                    filterDisplay="row"
                    [tableStyle]="{ 'min-width': '58rem' }"
                >
                    <ng-template #caption>
                        <div class="flex items-center justify-between gap-3">
                            <h5 class="m-0 font-semibold text-lg">Listado de Fotografías</h5>
                            <p-iconfield>
                                <p-inputicon styleClass="pi pi-search" />
                                <input pInputText type="text" (input)="onGlobalFilterFotografias($event)" placeholder="Buscar fotografías..." />
                            </p-iconfield>
                        </div>
                    </ng-template>

                    <ng-template #header>
                        <tr>
                            <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                            <th pSortableColumn="id" style="min-width: 6rem">ID <p-sortIcon field="id" /></th>
                            <th pSortableColumn="observacion_id" style="min-width: 10rem">Observación <p-sortIcon field="observacion_id" /></th>
                            <th pSortableColumn="ruta" style="min-width: 24rem">Ruta <p-sortIcon field="ruta" /></th>
                            <th pSortableColumn="estado_id" style="min-width: 8rem">Estado <p-sortIcon field="estado_id" /></th>
                            <th style="min-width: 9rem"></th>
                        </tr>
                        <tr>
                            <th></th>
                            <th><p-columnFilter type="numeric" field="id" placeholder="ID" /></th>
                            <th><p-columnFilter type="numeric" field="observacion_id" placeholder="Observación" /></th>
                            <th><p-columnFilter type="text" field="ruta" placeholder="Ruta" /></th>
                            <th><p-columnFilter type="numeric" field="estado_id" placeholder="Estado" /></th>
                            <th></th>
                        </tr>
                    </ng-template>

                    <ng-template #body let-f>
                        <tr>
                            <td style="width: 3rem"><p-tableCheckbox [value]="f" /></td>
                            <td>{{ f.id }}</td>
                            <td>{{ f.observacion_id }}</td>
                            <td class="font-mono">{{ f.ruta }}</td>
                            <td>{{ f.estado_id }}</td>
                            <td>
                                <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editFotografia(f)" pTooltip="Editar" tooltipPosition="top" />
                                <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteFotografia(f)" pTooltip="Eliminar" tooltipPosition="top" />
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="6" class="text-center py-10 text-surface-400">
                                <i class="pi pi-image text-4xl mb-3 block"></i>
                                No se encontraron fotografías de observaciones.
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="observacionDialog" [style]="{ width: '680px' }" [header]="observacionDialogTitle" [modal]="true" [blockScroll]="false">
            <ng-template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label class="block font-semibold mb-2">Encuestador <span class="text-red-500">*</span></label>
                        <app-encuestador-select
                            [(ngModel)]="observacion.encuestador_id"
                            [encuestadorIdSeleccionado]="observacion.encuestador_id ?? null"
                        />
                        @if (submittedObservacion && !observacion.encuestador_id) {
                            <small class="text-red-500">El encuestador es requerido.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Departamento <span class="text-red-500">*</span></label>
                        <app-departamento-select
                            [(ngModel)]="observacion.departamento_id"
                        />
                        @if (submittedObservacion && !observacion.departamento_id) {
                            <small class="text-red-500">El departamento es requerido.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Municipio <span class="text-red-500">*</span></label>
                        <app-municipio-select
                            [(ngModel)]="observacion.municipio_id"
                            [departamentoId]="observacion.departamento_id ?? null"
                        />
                        @if (submittedObservacion && !observacion.municipio_id) {
                            <small class="text-red-500">El municipio es requerido.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Centro Poblado <span class="text-red-500">*</span></label>
                        <app-centro-poblado-select
                            [(ngModel)]="observacion.centro_poblado_id"
                            [municipioId]="observacion.municipio_id ?? null"
                            [centroPobladoId]="observacion.centro_poblado_id ?? null"
                        />
                        @if (submittedObservacion && !observacion.centro_poblado_id) {
                            <small class="text-red-500">El centro poblado es requerido.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Estado <span class="text-red-500">*</span></label>
                        <input pInputText type="number" [(ngModel)]="observacion.estado_id" min="1" fluid />
                        @if (submittedObservacion && !observacion.estado_id) {
                            <small class="text-red-500">El estado es requerido.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Manzana</label>
                        <input pInputText [(ngModel)]="observacion.manzana" (ngModelChange)="observacion.manzana = toUpper($event)" maxlength="25" fluid />
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Predio</label>
                        <input pInputText [(ngModel)]="observacion.predio" (ngModelChange)="observacion.predio = toUpper($event)" maxlength="25" fluid />
                    </div>

                    <div class="md:col-span-2">
                        <label class="block font-semibold mb-2">Descripción <span class="text-red-500">*</span></label>
                        <textarea pTextarea [(ngModel)]="observacion.descripcion" rows="4" (ngModelChange)="observacion.descripcion = toUpper($event)" maxlength="500" fluid></textarea>
                        @if (submittedObservacion && !observacion.descripcion?.trim()) {
                            <small class="text-red-500">La descripción es requerida.</small>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideObservacionDialog()" [disabled]="savingObservacion()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveObservacion()" [loading]="savingObservacion()" />
            </ng-template>
        </p-dialog>

        <p-dialog [(visible)]="fotografiaDialog" [style]="{ width: '620px' }" [header]="fotografiaDialogTitle" [modal]="true" [blockScroll]="false">
            <ng-template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label class="block font-semibold mb-2">Observación ID <span class="text-red-500">*</span></label>
                        <input pInputText type="number" [(ngModel)]="fotografia.observacion_id" min="1" fluid />
                        @if (submittedFotografia && !fotografia.observacion_id) {
                            <small class="text-red-500">La observación es requerida.</small>
                        }
                    </div>

                    <div>
                        <label class="block font-semibold mb-2">Estado <span class="text-red-500">*</span></label>
                        <input pInputText type="number" [(ngModel)]="fotografia.estado_id" min="1" fluid />
                        @if (submittedFotografia && !fotografia.estado_id) {
                            <small class="text-red-500">El estado es requerido.</small>
                        }
                    </div>

                    <div class="md:col-span-2">
                        <label class="block font-semibold mb-2">Imagen <span class="text-red-500">*</span></label>
                        <input type="file" accept="image/*" (change)="onFotografiaFileSelected($event)" class="w-full p-inputtext" />
                        @if (fotografiaFileName) {
                            <small class="text-surface-500">Archivo seleccionado: {{ fotografiaFileName }}</small>
                        }
                        @if (submittedFotografia && !fotografiaFile && !fotografia.ruta?.trim()) {
                            <small class="text-red-500">La imagen es requerida.</small>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideFotografiaDialog()" [disabled]="savingFotografia()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveFotografia()" [loading]="savingFotografia()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '460px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Observaciones implements OnInit {
    observaciones = signal<Observacion[]>([]);
    fotografias = signal<FotografiaObservacion[]>([]);

    loadingObservaciones = signal(false);
    loadingFotografias = signal(false);
    savingObservacion = signal(false);
    savingFotografia = signal(false);

    selectedObservaciones: Observacion[] | null = null;
    selectedFotografias: FotografiaObservacion[] | null = null;

    observacionDialog = false;
    observacionDialogTitle = 'Nueva observación';
    editingObservacionId: number | null = null;
    observacion: Partial<Observacion> = {};
    submittedObservacion = false;

    fotografiaDialog = false;
    fotografiaDialogTitle = 'Nueva fotografía';
    editingFotografiaId: number | null = null;
    fotografia: Partial<FotografiaObservacion> = {};
    fotografiaFile: File | null = null;
    fotografiaFileName = '';
    submittedFotografia = false;
    fotografiasTablaDialog = false;
    selectedObservacionFotos: Observacion | null = null;

    totalObservaciones = computed(() => this.observaciones().length);
    totalFotografias = computed(() => this.fotografias().length);
    totalUbicadas = computed(() => this.observaciones().filter((o) => !!o.manzana?.trim() || !!o.predio?.trim()).length);
    totalEstadosUsados = computed(() => new Set(this.observaciones().map((o) => o.estado_id).filter((id) => !!id)).size);
    fotografiasPorObservacion = computed(() => {
        const observacionId = this.selectedObservacionFotos?.id;
        if (!observacionId) return [];
        return this.fotografias().filter((foto) => foto.observacion_id == observacionId);
    });
    fotografiasDialogTitle = computed(() => {
        if (!this.selectedObservacionFotos?.id) return 'Fotografías de Observaciones';
        const encuesta = this.selectedObservacionFotos.encuesta_id ?? '-';
        return `Fotografías de la Observación #${this.selectedObservacionFotos.id} - Encuesta ${encuesta}`;
    });

    @ViewChild('dtObservaciones') dtObservaciones!: Table;
    @ViewChild('dtFotografias') dtFotografias!: Table;

    constructor(
        private observacionService: ObservacionService,
        private fotografiaService: FotografiaObservacionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadObservaciones();
        this.loadFotografias();
    }

    loadObservaciones() {
        this.loadingObservaciones.set(true);
        this.observacionService.getAll().subscribe({
            next: (data) => {
                this.observaciones.set(data);
                this.loadingObservaciones.set(false);
            },
            error: () => {
                this.loadingObservaciones.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las observaciones.', life: 4000 });
            }
        });
    }

    loadFotografias() {
        this.loadingFotografias.set(true);
        this.fotografiaService.getAll().subscribe({
            next: (data) => {
                this.fotografias.set(data);
                this.loadingFotografias.set(false);
            },
            error: () => {
                this.loadingFotografias.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las fotografías.', life: 4000 });
            }
        });
    }

    onGlobalFilterObservaciones(event: Event) {
        this.dtObservaciones?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    onGlobalFilterFotografias(event: Event) {
        this.dtFotografias?.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openFotografiasTablaDialog(observacion: Observacion) {
        this.selectedObservacionFotos = observacion;
        this.selectedFotografias = null;
        this.fotografiasTablaDialog = true;
    }

    openNewFotografiaByObservacion() {
        if (!this.selectedObservacionFotos?.id) return;
        this.fotografia = {
            observacion_id: this.selectedObservacionFotos.id,
            estado_id: 1
        };
        this.fotografiaFile = null;
        this.fotografiaFileName = '';
        this.editingFotografiaId = null;
        this.submittedFotografia = false;
        this.fotografiaDialogTitle = `Nueva fotografía (Obs. #${this.selectedObservacionFotos.id})`;
        this.fotografiaDialog = true;
    }

    openNewObservacion() {
        this.observacion = {};
        this.editingObservacionId = null;
        this.submittedObservacion = false;
        this.observacionDialogTitle = 'Nueva observación';
        this.observacionDialog = true;
    }

    editObservacion(item: Observacion) {
        this.observacion = { ...item };
        this.editingObservacionId = item.id ?? null;
        this.submittedObservacion = false;
        this.observacionDialogTitle = 'Editar observación';
        this.observacionDialog = true;
    }

    hideObservacionDialog() {
        this.observacionDialog = false;
        this.editingObservacionId = null;
        this.submittedObservacion = false;
    }

    saveObservacion() {
        this.submittedObservacion = true;

        const departamentoId = this.toNullableNumber(this.observacion.departamento_id);
        const municipioId = this.toNullableNumber(this.observacion.municipio_id);
        const centroPobladoId = this.toNullableNumber(this.observacion.centro_poblado_id);

        if (!this.observacion.encuestador_id || !departamentoId || !municipioId || !centroPobladoId || !this.observacion.estado_id || !this.observacion.descripcion?.trim()) {
            return;
        }

        const payload: Partial<Observacion> = {
            encuestador_id: Number(this.observacion.encuestador_id),
            departamento_id: departamentoId,
            municipio_id: municipioId,
            centro_poblado_id: centroPobladoId,
            manzana: this.toUpper(this.observacion.manzana),
            predio: this.toUpper(this.observacion.predio),
            descripcion: this.toUpper(this.observacion.descripcion),
            estado_id: Number(this.observacion.estado_id)
        };

        this.savingObservacion.set(true);

        if (this.editingObservacionId !== null) {
            this.observacionService.update(this.editingObservacionId, payload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Observación actualizada.', life: 3000 });
                    this.observacionDialog = false;
                    this.editingObservacionId = null;
                    this.savingObservacion.set(false);
                    this.loadObservaciones();
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo actualizar la observación.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.savingObservacion.set(false);
                }
            });
            return;
        }

        this.observacionService.create(payload).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Observación creada.', life: 3000 });
                this.observacionDialog = false;
                this.savingObservacion.set(false);
                this.loadObservaciones();
            },
            error: (err) => {
                const msg = err?.error?.message || 'No se pudo crear la observación.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                this.savingObservacion.set(false);
            }
        });
    }

    deleteObservacion(item: Observacion) {
        this.confirmationService.confirm({
            message: `¿Eliminar observación <strong>#${item.id}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.observacionService.delete(item.id!).subscribe({
                    next: () => {
                        this.observaciones.update((list) => list.filter((obs) => obs.id !== item.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Observación eliminada.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la observación.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelectedObservaciones() {
        if (!this.selectedObservaciones?.length) return;

        this.confirmationService.confirm({
            message: `¿Eliminar <strong>${this.selectedObservaciones.length}</strong> observaciones seleccionadas?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.selectedObservaciones!.map((item) => item.id!).filter(Boolean);
                let done = 0;

                ids.forEach((id) => {
                    this.observacionService.delete(id).subscribe({
                        next: () => {
                            done++;
                            this.observaciones.update((list) => list.filter((item) => item.id !== id));
                            if (done == ids.length) {
                                this.selectedObservaciones = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminadas', detail: 'Observaciones eliminadas.', life: 3000 });
                            }
                        },
                        error: () => {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron eliminar todas las observaciones.', life: 4000 });
                        }
                    });
                });
            }
        });
    }

    openNewFotografia() {
        this.fotografia = {};
        this.fotografiaFile = null;
        this.fotografiaFileName = '';
        this.editingFotografiaId = null;
        this.submittedFotografia = false;
        this.fotografiaDialogTitle = 'Nueva fotografía';
        this.fotografiaDialog = true;
    }

    editFotografia(item: FotografiaObservacion) {
        this.fotografia = { ...item };
        this.fotografiaFile = null;
        this.fotografiaFileName = '';
        this.editingFotografiaId = item.id ?? null;
        this.submittedFotografia = false;
        this.fotografiaDialogTitle = 'Editar fotografía';
        this.fotografiaDialog = true;
    }

    hideFotografiaDialog() {
        this.fotografiaDialog = false;
        this.fotografiaFile = null;
        this.fotografiaFileName = '';
        this.editingFotografiaId = null;
        this.submittedFotografia = false;
    }

    onFotografiaFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;

        this.fotografiaFile = file;
        this.fotografiaFileName = file?.name ?? '';

        if (file) {
            this.fotografia.ruta = this.normalizePath(file.name);
        }
    }

    saveFotografia() {
        this.submittedFotografia = true;

        if (!this.fotografia.observacion_id || !this.fotografia.estado_id || (!this.fotografiaFile && !this.fotografia.ruta?.trim())) {
            return;
        }

        const payload: Record<string, unknown> = {
            observacion_id: Number(this.fotografia.observacion_id),
            ruta: this.normalizePath(this.fotografia.ruta),
            estado_id: Number(this.fotografia.estado_id)
        };

        this.savingFotografia.set(true);

        if (this.editingFotografiaId !== null) {
            const request = this.fotografiaFile
                ? this.fotografiaService.updateWithFormData(this.editingFotografiaId, payload, this.fotografiaFile)
                : this.fotografiaService.update(this.editingFotografiaId, payload as Partial<FotografiaObservacion>);

            request.subscribe({
                next: (updated) => {
                    this.fotografias.update((list) => list.map((item) => (item.id == updated.id ? updated : item)));
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Fotografía actualizada.', life: 3000 });
                    this.fotografiaDialog = false;
                    this.fotografiaFile = null;
                    this.fotografiaFileName = '';
                    this.editingFotografiaId = null;
                    this.savingFotografia.set(false);
                },
                error: (err) => {
                    const msg = err?.error?.message || 'No se pudo actualizar la fotografía.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                    this.savingFotografia.set(false);
                }
            });
            return;
        }

        const request = this.fotografiaFile
            ? this.fotografiaService.createWithFormData(payload, this.fotografiaFile)
            : this.fotografiaService.create(payload as Partial<FotografiaObservacion>);

        request.subscribe({
            next: (created) => {
                this.fotografias.update((list) => [...list, created]);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Fotografía creada.', life: 3000 });
                this.fotografiaDialog = false;
                this.fotografiaFile = null;
                this.fotografiaFileName = '';
                this.savingFotografia.set(false);
            },
            error: (err) => {
                const msg = err?.error?.message || 'No se pudo crear la fotografía.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
                this.savingFotografia.set(false);
            }
        });
    }

    deleteFotografia(item: FotografiaObservacion) {
        this.confirmationService.confirm({
            message: `¿Eliminar fotografía <strong>#${item.id}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.fotografiaService.delete(item.id!).subscribe({
                    next: () => {
                        this.fotografias.update((list) => list.filter((foto) => foto.id !== item.id));
                        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Fotografía eliminada.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la fotografía.', life: 4000 });
                    }
                });
            }
        });
    }

    deleteSelectedFotografias() {
        if (!this.selectedFotografias?.length) return;

        this.confirmationService.confirm({
            message: `¿Eliminar <strong>${this.selectedFotografias.length}</strong> fotografías seleccionadas?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const ids = this.selectedFotografias!.map((item) => item.id!).filter(Boolean);
                let done = 0;

                ids.forEach((id) => {
                    this.fotografiaService.delete(id).subscribe({
                        next: () => {
                            done++;
                            this.fotografias.update((list) => list.filter((item) => item.id !== id));
                            if (done == ids.length) {
                                this.selectedFotografias = null;
                                this.messageService.add({ severity: 'success', summary: 'Eliminadas', detail: 'Fotografías eliminadas.', life: 3000 });
                            }
                        },
                        error: () => {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron eliminar todas las fotografías.', life: 4000 });
                        }
                    });
                });
            }
        });
    }

    exportExcel() {
        const observacionesById = new Map<number, Observacion>();
        this.observaciones().forEach((o) => {
            if (o.id != null) {
                observacionesById.set(o.id, o);
            }
        });

        const observacionesData = this.observaciones().map((o) => ({
            Codigo: o.id,
            Encuestador: `${o.encuestador?.nombres || ''} ${o.encuestador?.apellidos || ''}`.trim() || '-',
            Departamento: o.departamento?.nombre || '-',
            Municipio: o.municipio?.nombre || '-',
            CentroPoblado: o.centro_poblado?.nombre || '-',
            Manzana: o.manzana || '-',
            Predio: o.predio || '-',
            Descripcion: o.descripcion || '-',
            FechaSincronizacion: this.formatFechaSincronizacion(o.created_at),
            Estado: o.estado?.nombre || this.getEstadoNombre(o.estado_id)
        }));

        const fotografiasData = this.fotografias().map((f) => ({
            Observacion: observacionesById.get(f.observacion_id)?.descripcion || '-',
            Ruta: f.ruta || '-',
            Estado: this.getEstadoNombre(f.estado_id)
        }));

        const workbook = XLSX.utils.book_new();

        const observacionesSheet = XLSX.utils.json_to_sheet(observacionesData);
        observacionesSheet['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 22 }, { wch: 22 }, { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 20 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(workbook, observacionesSheet, 'Observaciones');

        const fotografiasSheet = XLSX.utils.json_to_sheet(fotografiasData);
        fotografiasSheet['!cols'] = [{ wch: 50 }, { wch: 50 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(workbook, fotografiasSheet, 'Fotografias');

        XLSX.writeFile(workbook, `Observaciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    getEstadoNombre(estadoId?: number | null): string {
        if (estadoId == 1) return 'ACTIVO';
        if (estadoId == 2) return 'INACTIVO';
        if (estadoId == 3) return 'PENDIENTE';
        return 'SIN ESTADO';
    }

    formatFechaSincronizacion(raw?: string | null): string {
        if (!raw) return '-';

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) return '-';

        const day = `${parsed.getDate()}`.padStart(2, '0');
        const month = `${parsed.getMonth() + 1}`.padStart(2, '0');
        const year = parsed.getFullYear();
        const hours = `${parsed.getHours()}`.padStart(2, '0');
        const minutes = `${parsed.getMinutes()}`.padStart(2, '0');
        const seconds = `${parsed.getSeconds()}`.padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    toUpper(value?: string | null): string {
        return (value || '').toUpperCase().trim();
    }

    normalizePath(value?: string | null): string {
        return (value || '').trim().replace(/\\+/g, '/');
    }

    toNullableNumber(value: unknown): number | null {
        if (value == null || value == undefined || value == '') {
            return null;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
}
