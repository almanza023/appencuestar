import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Encuesta, EncuestaService, EncuestaPdfResponse } from '@/app/pages/service/encuesta.service';
import { Formulario, FormularioService, PreguntaFormulario } from '@/app/pages/service/formulario.service';
import { CentroPoblado, CentroPobladoService } from '@/app/pages/service/centro-poblado.service';
import { Departamento, DepartamentoService } from '@/app/pages/service/departamento.service';
import { Hogar, HogarService } from '@/app/pages/service/hogar.service';
import { Municipio, MunicipioService } from '@/app/pages/service/municipio.service';
import { Respuesta, RespuestaService } from '@/app/pages/service/respuesta.service';
import { ValorOpcionRespuesta, ValorOpcionRespuestaService } from '@/app/pages/service/valor-opcion-respuesta.service';
import { AuthService } from '@/app/core/services/auth.service';
import { DepartamentoSelectComponent } from '@/app/shared/components/departamento-select/departamento-select.component';
import { MunicipioSelectComponent } from '@/app/shared/components/municipio-select/municipio-select.component';
import { CentroPobladoSelectComponent } from '@/app/shared/components/centro-poblado-select/centro-poblado-select.component';
import { SexoSelectComponent } from '@/app/shared/components/sexo-select/sexo-select.component';
import { TipoViviendaSelectComponent } from '@/app/shared/components/tipo-vivienda-select/tipo-vivienda-select.component';

type RespuestaDetalle = {
    respuestaId: number | null;
    preguntaId: number | null;
    preguntaEtiqueta: string;
    valorTexto: string;
    opcionesSeleccionadas: string[];
};

type OpcionPreguntaLookup = {
    id: number;
    etiqueta: string;
};

type ResumenEncuestador = {
    encuestadorId: number;
    nombre: string;
    total: number;
};

type ResumenDia = {
    encuestadorId: number;
    nombre: string;
    fecha: string;
    total: number;
};

type ResumenDepartamento = {
    departamentoId: number | string;
    departamento: string;
    total: number;
};

type ResumenMunicipio = {
    municipioId: number | string;
    departamento: string;
    municipio: string;
    total: number;
};

type ResumenCentroPoblado = {
    centroPobladoId: number | string;
    departamento: string;
    municipio: string;
    centroPoblado: string;
    total: number;
};

@Component({
    selector: 'app-encuestas',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, SelectModule, DialogModule, ConfirmDialogModule, ToastModule, DatePickerModule, InputTextModule, InputNumberModule, TextareaModule, DepartamentoSelectComponent, MunicipioSelectComponent, CentroPobladoSelectComponent, SexoSelectComponent, TipoViviendaSelectComponent],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmdialog />

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 shadow-sm">
                <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Encuestas</span>
                <div class="text-4xl font-bold mt-2">{{ encuestas().length }}</div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 shadow-sm">
                <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Filtradas</span>
                <div class="text-4xl font-bold mt-2 text-blue-600 dark:text-blue-400">{{ encuestasFiltradas().length }}</div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 shadow-sm">
                <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Formularios</span>
                <div class="text-4xl font-bold mt-2 text-green-600 dark:text-green-400">{{ formularios().length }}</div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 shadow-sm">
                <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Hogares</span>
                <div class="text-4xl font-bold mt-2 text-yellow-600 dark:text-yellow-400">{{ hogaresUnicos() }}</div>
            </div>
        </div>

        <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 mb-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block mb-2 font-semibold">Filtrar por Encuestador</label>
                    <p-select
                        [options]="encuestadorFilterOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [ngModel]="filtroEncuestadorId()"
                        (ngModelChange)="filtroEncuestadorId.set($event)"
                        [showClear]="true"
                        appendTo="body"
                        placeholder="Todos los encuestadores"
                        class="w-full"
                    ></p-select>
                </div>
                <div>
                    <label class="block mb-2 font-semibold">Filtrar por Hogar</label>
                    <p-select
                        [options]="hogarFilterOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [ngModel]="filtroHogarId()"
                        (ngModelChange)="filtroHogarId.set($event)"
                        [showClear]="true"
                        appendTo="body"
                        placeholder="Todos los hogares"
                        class="w-full"
                    ></p-select>
                </div>
                <div class="flex items-end gap-2 pb-0.5">
                    <p-button
                        label="Resumen por Encuestador"
                        icon="pi pi-chart-bar"
                        severity="secondary"
                        [outlined]="true"
                        (onClick)="resumenDialogVisible = true"
                    ></p-button>
                    <p-button
                        label="Resumen por Día"
                        icon="pi pi-calendar"
                        severity="info"
                        [outlined]="true"
                        (onClick)="resumenDiaDialogVisible = true"
                    ></p-button>
                    <p-button
                        label="Resumen por Ubicación"
                        icon="pi pi-map-marker"
                        severity="contrast"
                        [outlined]="true"
                        (onClick)="openResumenUbicacion()"
                    ></p-button>
                    @if (filtroFechaDesde() || filtroFechaHasta()) {
                        <p-button
                            label="Limpiar fechas"
                            icon="pi pi-times"
                            severity="danger"
                            [outlined]="true"
                            (onClick)="limpiarFechas()"
                        ></p-button>
                    }
                </div>
            </div>
            <!-- Filtro por fecha -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                <div>
                    <label class="block mb-2 font-semibold">Fecha Desde</label>
                    <p-datepicker
                        [ngModel]="filtroFechaDesde()"
                        (ngModelChange)="filtroFechaDesde.set($event)"
                        dateFormat="yy-mm-dd"
                        [showClear]="true"
                        [showIcon]="true"
                        appendTo="body"
                        placeholder="Seleccionar fecha"
                        class="w-full"
                    ></p-datepicker>
                </div>
                <div>
                    <label class="block mb-2 font-semibold">Fecha Hasta</label>
                    <p-datepicker
                        [ngModel]="filtroFechaHasta()"
                        (ngModelChange)="filtroFechaHasta.set($event)"
                        dateFormat="yy-mm-dd"
                        [showClear]="true"
                        [showIcon]="true"
                        appendTo="body"
                        placeholder="Seleccionar fecha"
                        class="w-full"
                    ></p-datepicker>
                </div>
            </div>

        <p-table [value]="encuestasFiltradas()" [rows]="10" [paginator]="true" [loading]="loading()" dataKey="id" [tableStyle]="{ 'min-width': '98rem' }">
            <ng-template #header>
                <tr>
                    <th style="min-width: 6rem">Código</th>
                    <th style="min-width: 14rem">Hogar</th>
                    <th style="min-width: 12rem">Departamento</th>
                    <th style="min-width: 12rem">Municipio</th>
                    <th style="min-width: 12rem">Centro Poblado</th>
                    <th style="min-width: 14rem">Encuestador</th>
                    <th style="min-width: 12rem">Fecha y Hora</th>
                    <th style="min-width: 8rem">Estado</th>
                    <th style="min-width: 14rem">Acciones</th>
                </tr>
            </ng-template>

            <ng-template #body let-encuesta>
                <tr>
                    <td>{{ encuesta.id }}</td>
                    <td class="uppercase">{{ getHogarLabel(encuesta) }}</td>
                    <td class="uppercase">{{ getDepartamentoLabel(encuesta) }}</td>
                    <td class="uppercase">{{ getMunicipioLabel(encuesta) }}</td>
                    <td class="uppercase">{{ getCentroPobladoLabel(encuesta) }}</td>
                    <td class="uppercase">{{ getEncuestadorLabel(encuesta) }}</td>
                    <td>{{ formatDateTime(encuesta.created_at) }}</td>
                    <td>
                        <p-tag [value]="encuesta.estado?.nombre" [severity]="estadoSeverity(encuesta.estado_id)"></p-tag>
                    </td>
                    <td>
                        <div class="flex flex-wrap gap-2">
                            <p-button label="Ver Formulario y Respuestas" icon="pi pi-eye" [outlined]="true" (onClick)="openDetail(encuesta)"></p-button>
                            <p-button
                                label="Descargar PDF"
                                icon="pi pi-file-pdf"
                                severity="help"
                                [outlined]="true"
                                [loading]="downloadingPdfId() == encuesta.id"
                                (onClick)="descargarPdf(encuesta)"
                            ></p-button>
                            <p-button label="Editar Preguntas" icon="pi pi-pencil" severity="info" [outlined]="true" (onClick)="editarPreguntas(encuesta)"></p-button>
                            <p-button label="Eliminar" icon="pi pi-trash" severity="danger" [outlined]="true" (onClick)="confirmDeleteEncuesta(encuesta)"></p-button>
                            <p-button label="Editar Hogar" icon="pi pi-home" severity="warn" [outlined]="true" (onClick)="openEditHogar(encuesta)"></p-button>
                        </div>
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="9" class="text-center py-10 text-surface-400">No hay encuestas para mostrar con los filtros seleccionados.</td>
                </tr>
            </ng-template>
        </p-table>

        <!-- Modal: Editar Hogar -->
        <p-dialog
            [(visible)]="editHogarDialogVisible"
            [modal]="true"
            [style]="{ width: '760px', maxWidth: '96vw' }"
            header="Editar Información del Hogar"
        >
            @if (editHogar) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Cédula *</label>
                        <input pInputText [(ngModel)]="editHogar!.cedula" placeholder="Cédula" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Nombre de la Persona *</label>
                        <input pInputText [(ngModel)]="editHogar!.nombre_persona" placeholder="Nombre" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Departamento *</label>
                        <app-departamento-select
                            [(ngModel)]="editHogar!.departamento_id"
                            (ngModelChange)="onDeptChange($event)"
                        ></app-departamento-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Municipio *</label>
                        <app-municipio-select
                            [(ngModel)]="editHogar!.municipio_id"
                            [departamentoId]="editHogar!.departamento_id"
                        ></app-municipio-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Centro Poblado</label>
                        <app-centro-poblado-select
                            [(ngModel)]="editHogar!.centro_poblado_id"
                            [municipioId]="editHogar!.municipio_id"
                        ></app-centro-poblado-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Manzana</label>
                        <input pInputText [(ngModel)]="editHogar!.manzana" placeholder="Manzana" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Predio</label>
                        <input pInputText [(ngModel)]="editHogar!.predio" placeholder="Predio" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Teléfono</label>
                        <input pInputText [(ngModel)]="editHogar!.telefono" placeholder="Teléfono" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Estrato</label>
                        <input pInputText [(ngModel)]="editHogar!.estrato" placeholder="Estrato" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Tipo de Vivienda</label>
                        <app-tipo-vivienda-select [(ngModel)]="editHogar!.tipo_vivienda"></app-tipo-vivienda-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Edad</label>
                        <p-inputnumber [(ngModel)]="editHogar!.edad" [min]="0" [max]="120" placeholder="Edad" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Sexo</label>
                        <app-sexo-select [(ngModel)]="editHogar!.sexo"></app-sexo-select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-semibold text-sm">Ocupación</label>
                        <input pInputText [(ngModel)]="editHogar!.ocupacion" placeholder="Ocupación" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1 md:col-span-2">
                        <label class="font-semibold text-sm">Salario</label>
                        <input pInputText [(ngModel)]="editHogar!.salario" placeholder="Salario" class="w-full" />
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-5">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [outlined]="true" (onClick)="editHogarDialogVisible = false"></p-button>
                    <p-button label="Guardar" icon="pi pi-check" severity="success" [loading]="savingHogar" (onClick)="saveHogar()"></p-button>
                </div>
            }
        </p-dialog>

        <!-- Modal: Resumen por Encuestador -->
        <p-dialog
            [(visible)]="resumenDialogVisible"
            [modal]="true"
            [style]="{ width: '640px', maxWidth: '96vw' }"
            header="Total de Encuestas por Encuestador"
        >
            <div class="flex justify-end mb-3">
                <p-button
                    label="Exportar Excel"
                    icon="pi pi-file-excel"
                    severity="success"
                    [outlined]="true"
                    size="small"
                    (onClick)="exportarExcelResumen()"
                ></p-button>
            </div>
            <p-table [value]="resumenPorEncuestador()" [rows]="20" [paginator]="resumenPorEncuestador().length > 20" [tableStyle]="{ 'min-width': '100%' }" styleClass="p-datatable-sm">
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="nombre">Encuestador <p-sortIcon field="nombre" /></th>
                        <th pSortableColumn="total" style="width: 8rem; text-align: center">Total <p-sortIcon field="total" /></th>
                        <th style="width: 6rem; text-align: center">%</th>
                    </tr>
                </ng-template>
                <ng-template #body let-r>
                    <tr>
                        <td class="uppercase font-medium">{{ r.nombre }}</td>
                        <td style="text-align: center">
                            <span class="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold px-3 py-0.5 text-sm">{{ r.total }}</span>
                        </td>
                        <td style="text-align: center" class="text-surface-500 text-sm">
                            {{ encuestas().length ? ((r.total / encuestas().length) * 100 | number: '1.0-1') + '%' : '-' }}
                        </td>
                    </tr>
                </ng-template>
                <ng-template #footer>
                    <tr class="font-bold bg-surface-50 dark:bg-surface-800">
                        <td>Total</td>
                        <td style="text-align: center">{{ encuestas().length }}</td>
                        <td style="text-align: center">100%</td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="3" class="text-center py-8 text-surface-400">No hay datos disponibles.</td>
                    </tr>
                </ng-template>
            </p-table>
        </p-dialog>

        <!-- Modal: Resumen por Encuestador y Día -->
        <p-dialog
            [(visible)]="resumenDiaDialogVisible"
            [modal]="true"
            [style]="{ width: '720px', maxWidth: '96vw' }"
            header="Encuestas por Encuestador y Día"
        >
            <!-- Filtros de fecha -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                    <label class="block mb-2 font-semibold text-sm">Fecha Desde</label>
                    <p-datepicker
                        [ngModel]="filtroDiaDesde()"
                        (ngModelChange)="filtroDiaDesde.set($event)"
                        dateFormat="yy-mm-dd"
                        [showClear]="true"
                        [showIcon]="true"
                        appendTo="body"
                        placeholder="Desde"
                        class="w-full"
                    ></p-datepicker>
                </div>
                <div>
                    <label class="block mb-2 font-semibold text-sm">Fecha Hasta</label>
                    <p-datepicker
                        [ngModel]="filtroDiaHasta()"
                        (ngModelChange)="filtroDiaHasta.set($event)"
                        dateFormat="yy-mm-dd"
                        [showClear]="true"
                        [showIcon]="true"
                        appendTo="body"
                        placeholder="Hasta"
                        class="w-full"
                    ></p-datepicker>
                </div>
            </div>
            <div class="flex items-center justify-between mb-3">
                <div class="text-sm text-surface-500">
                    @if (filtroDiaDesde() || filtroDiaHasta()) {
                        <span>Mostrando {{ resumenPorDia().length }} registro(s) filtrado(s)</span>
                        <p-button
                            label="Limpiar"
                            icon="pi pi-times"
                            severity="secondary"
                            [outlined]="true"
                            size="small"
                            styleClass="ml-2"
                            (onClick)="filtroDiaDesde.set(null); filtroDiaHasta.set(null)"
                        ></p-button>
                    }
                </div>
                <p-button
                    label="Exportar Excel"
                    icon="pi pi-file-excel"
                    severity="success"
                    [outlined]="true"
                    size="small"
                    (onClick)="exportarExcelResumenDia()"
                ></p-button>
            </div>
            <p-table
                [value]="resumenPorDia()"
                [rows]="20"
                [paginator]="resumenPorDia().length > 20"
                [tableStyle]="{ 'min-width': '100%' }"
                styleClass="p-datatable-sm"
                [rowGroupMode]="'subheader'"
                groupRowsBy="nombre"
                sortField="nombre"
                [sortOrder]="1"
            >
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="nombre">Encuestador <p-sortIcon field="nombre" /></th>
                        <th pSortableColumn="fecha" style="width: 9rem">Fecha <p-sortIcon field="fecha" /></th>
                        <th pSortableColumn="total" style="width: 7rem; text-align: center">Total <p-sortIcon field="total" /></th>
                    </tr>
                </ng-template>
                <ng-template #groupheader let-r>
                    <tr class="bg-surface-100 dark:bg-surface-700 font-semibold">
                        <td colspan="3" class="uppercase">{{ r.nombre }}</td>
                    </tr>
                </ng-template>
                <ng-template #body let-r>
                    <tr>
                        <td class="text-surface-400 text-sm pl-6">—</td>
                        <td>{{ r.fecha }}</td>
                        <td style="text-align: center">
                            <span class="inline-flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-bold px-3 py-0.5 text-sm">{{ r.total }}</span>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="3" class="text-center py-8 text-surface-400">No hay datos disponibles.</td>
                    </tr>
                </ng-template>
            </p-table>
        </p-dialog>

        <p-dialog
            [(visible)]="resumenUbicacionDialogVisible"
            [modal]="true"
            [style]="{ width: '980px', maxWidth: '96vw' }"
            header="Resumen de Encuestas por Ubicación"
        >
            <div class="flex flex-col gap-4">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div class="text-sm text-surface-500">
                        Total de encuestas analizadas: <span class="font-semibold text-surface-700 dark:text-surface-100">{{ encuestas().length }}</span>
                    </div>
                    <div class="flex justify-end">
                        <p-button
                            label="Exportar Excel"
                            icon="pi pi-file-excel"
                            severity="success"
                            [outlined]="true"
                            size="small"
                            (onClick)="exportarExcelResumenUbicacion()"
                        ></p-button>
                    </div>
                </div>

                <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                    <div class="flex items-center justify-between mb-3 gap-3">
                        <h5 class="m-0 text-base font-semibold">Por Departamento</h5>
                        <span class="text-sm text-surface-500">{{ resumenPorDepartamento().length }} registro(s)</span>
                    </div>
                    <p-table [value]="resumenPorDepartamento()" [rows]="10" [paginator]="resumenPorDepartamento().length > 10" [tableStyle]="{ 'min-width': '100%' }" styleClass="p-datatable-sm">
                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="departamento">Departamento <p-sortIcon field="departamento" /></th>
                                <th pSortableColumn="total" style="width: 8rem; text-align: center">Total <p-sortIcon field="total" /></th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-r>
                            <tr>
                                <td class="uppercase font-medium">{{ r.departamento }}</td>
                                <td style="text-align: center">
                                    <span class="inline-flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200 font-bold px-3 py-0.5 text-sm">{{ r.total }}</span>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template #footer>
                            <tr class="font-bold bg-surface-50 dark:bg-surface-800">
                                <td>Total</td>
                                <td style="text-align: center">{{ encuestas().length }}</td>
                            </tr>
                        </ng-template>
                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="2" class="text-center py-8 text-surface-400">No hay datos disponibles.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>

                <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                    <div class="flex items-center justify-between mb-3 gap-3">
                        <h5 class="m-0 text-base font-semibold">Por Municipio</h5>
                        <span class="text-sm text-surface-500">{{ resumenPorMunicipio().length }} registro(s)</span>
                    </div>
                    <p-table [value]="resumenPorMunicipio()" [rows]="10" [paginator]="resumenPorMunicipio().length > 10" [tableStyle]="{ 'min-width': '100%' }" styleClass="p-datatable-sm">
                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="departamento">Departamento <p-sortIcon field="departamento" /></th>
                                <th pSortableColumn="municipio">Municipio <p-sortIcon field="municipio" /></th>
                                <th pSortableColumn="total" style="width: 8rem; text-align: center">Total <p-sortIcon field="total" /></th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-r>
                            <tr>
                                <td class="uppercase">{{ r.departamento }}</td>
                                <td class="uppercase font-medium">{{ r.municipio }}</td>
                                <td style="text-align: center">
                                    <span class="inline-flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-200 font-bold px-3 py-0.5 text-sm">{{ r.total }}</span>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template #footer>
                            <tr class="font-bold bg-surface-50 dark:bg-surface-800">
                                <td colspan="2">Total</td>
                                <td style="text-align: center">{{ encuestas().length }}</td>
                            </tr>
                        </ng-template>
                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="3" class="text-center py-8 text-surface-400">No hay datos disponibles.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>

                <div class="rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                    <div class="flex items-center justify-between mb-3 gap-3">
                        <h5 class="m-0 text-base font-semibold">Por Centro Poblado</h5>
                        <span class="text-sm text-surface-500">{{ resumenPorCentroPoblado().length }} registro(s)</span>
                    </div>
                    <p-table [value]="resumenPorCentroPoblado()" [rows]="10" [paginator]="resumenPorCentroPoblado().length > 10" [tableStyle]="{ 'min-width': '100%' }" styleClass="p-datatable-sm">
                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="departamento">Departamento <p-sortIcon field="departamento" /></th>
                                <th pSortableColumn="municipio">Municipio <p-sortIcon field="municipio" /></th>
                                <th pSortableColumn="centroPoblado">Centro Poblado <p-sortIcon field="centroPoblado" /></th>
                                <th pSortableColumn="total" style="width: 8rem; text-align: center">Total <p-sortIcon field="total" /></th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-r>
                            <tr>
                                <td class="uppercase">{{ r.departamento }}</td>
                                <td class="uppercase">{{ r.municipio }}</td>
                                <td class="uppercase font-medium">{{ r.centroPoblado }}</td>
                                <td style="text-align: center">
                                    <span class="inline-flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 font-bold px-3 py-0.5 text-sm">{{ r.total }}</span>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template #footer>
                            <tr class="font-bold bg-surface-50 dark:bg-surface-800">
                                <td colspan="3">Total</td>
                                <td style="text-align: center">{{ encuestas().length }}</td>
                            </tr>
                        </ng-template>
                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="4" class="text-center py-8 text-surface-400">No hay datos disponibles.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </p-dialog>

        <p-dialog
            [(visible)]="detailDialogVisible"
            [modal]="true"
            [blockScroll]="false"
            [style]="{ width: '1000px', maxWidth: '96vw' }"
            header="Detalle de Encuesta"
        >
            @if (selectedEncuesta()) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-3">
                        <div class="text-xs uppercase text-surface-500 mb-1">ID Encuesta</div>
                        <div class="text-lg font-semibold">{{ selectedEncuesta()?.id }}</div>
                    </div>
                    <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-3">
                        <div class="text-xs uppercase text-surface-500 mb-1">Fecha y Hora</div>
                        <div class="text-lg font-semibold">{{ formatDateTime(selectedEncuesta()?.created_at || null) }}</div>
                    </div>
                    <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-3">
                        <div class="text-xs uppercase text-surface-500 mb-1">Formulario</div>
                        <div class="text-base font-semibold uppercase">{{ getFormularioLabel(selectedEncuesta()?.formulario_id || null) }}</div>
                    </div>
                    <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-3">
                        <div class="text-xs uppercase text-surface-500 mb-1">Hogar</div>
                        <div class="text-base font-semibold uppercase">{{ getHogarLabel(selectedEncuesta()) }}</div>
                    </div>
                    <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-3">
                        <div class="text-xs uppercase text-surface-500 mb-1">Encuestador</div>
                        <div class="text-base font-semibold uppercase">{{ getEncuestadorLabel(selectedEncuesta()) }}</div>
                    </div>

                </div>

                <h5 class="m-0 mb-3 text-lg font-semibold">Respuestas del Formulario</h5>

                <p-table [value]="respuestasDetalle()" [rows]="10" [paginator]="true" [loading]="detailLoading()" [tableStyle]="{ 'min-width': '60rem' }">
                    <ng-template #header>
                        <tr>
                            <th style="min-width: 6rem">ID Respuesta</th>
                            <th style="min-width: 8rem">Pregunta ID</th>
                            <th style="min-width: 20rem">Pregunta</th>
                            <th style="min-width: 14rem">Valor Texto</th>
                            <th style="min-width: 16rem">Opciones Seleccionadas</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-r>
                        <tr>
                            <td>{{ r.respuestaId || '-' }}</td>
                            <td>{{ r.preguntaId || '-' }}</td>
                            <td class="uppercase">{{ r.preguntaEtiqueta }}</td>
                            <td class="uppercase">{{ r.valorTexto || '-' }}</td>
                            <td class="uppercase">{{ r.opcionesSeleccionadas.length ? r.opcionesSeleccionadas.join(', ') : '-' }}</td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="5" class="text-center py-8 text-surface-400">Esta encuesta no tiene respuestas registradas.</td>
                        </tr>
                    </ng-template>
                </p-table>
            }
        </p-dialog>
    `
})
export class Encuestas implements OnInit {
    encuestas = signal<Encuesta[]>([]);
    formularios = signal<Formulario[]>([]);
    hogares = signal<Hogar[]>([]);
    departamentos = signal<Departamento[]>([]);
    municipios = signal<Municipio[]>([]);
    centrosPoblados = signal<CentroPoblado[]>([]);
    loading = signal(false);

    filtroEncuestadorId = signal<number | null>(null);
    filtroHogarId = signal<number | null>(null);
    filtroFechaDesde = signal<Date | null>(null);
    filtroFechaHasta = signal<Date | null>(null);

    detailDialogVisible = false;
    resumenDialogVisible = false;
    resumenDiaDialogVisible = false;
    resumenUbicacionDialogVisible = false;
    editHogarDialogVisible = false;
    detailLoading = signal(false);
    selectedEncuesta = signal<Encuesta | null>(null);
    respuestasDetalle = signal<RespuestaDetalle[]>([]);
    downloadingPdfId = signal<number | null>(null);
    editHogar: Hogar | null = null;
    savingHogar = false;

    filtroDiaDesde = signal<Date | null>(null);
    filtroDiaHasta = signal<Date | null>(null);

    private respuestasCache: Respuesta[] = [];
    private valoresOpcionCache: ValorOpcionRespuesta[] = [];

    hogaresUnicos = computed(() => new Set(this.encuestas().map((e) => e.hogar_id).filter(Boolean)).size);

    hogaresLookup = computed(() => {
        const mapa = new Map<number, Hogar>();
        for (const hogar of this.hogares()) {
            const hogarId = this.normalizarId(hogar.id);
            if (hogarId != null) {
                mapa.set(hogarId, hogar);
            }
        }
        return mapa;
    });

    departamentosLookup = computed(() => {
        const mapa = new Map<number, string>();
        for (const departamento of this.departamentos()) {
            if (departamento.id != null) {
                mapa.set(departamento.id, departamento.nombre);
            }
        }
        return mapa;
    });

    municipiosLookup = computed(() => {
        const mapa = new Map<number, string>();
        for (const municipio of this.municipios()) {
            if (municipio.id != null) {
                mapa.set(municipio.id, municipio.nombre);
            }
        }
        return mapa;
    });

    centrosPobladosLookup = computed(() => {
        const mapa = new Map<number, string>();
        for (const centro of this.centrosPoblados()) {
            if (centro.id != null) {
                mapa.set(centro.id, centro.nombre);
            }
        }
        return mapa;
    });

    resumenPorEncuestador = computed<ResumenEncuestador[]>(() => {
        const mapa = new Map<number, ResumenEncuestador>();
        for (const e of this.encuestas()) {
            if (!e.encuestador_id) continue;
            if (!mapa.has(e.encuestador_id)) {
                mapa.set(e.encuestador_id, {
                    encuestadorId: e.encuestador_id,
                    nombre: this.getEncuestadorLabel(e),
                    total: 0
                });
            }
            mapa.get(e.encuestador_id)!.total++;
        }
        return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
    });

    resumenPorDia = computed<ResumenDia[]>(() => {
        const desde = this.filtroDiaDesde();
        const hasta = this.filtroDiaHasta();
        const mapa = new Map<string, ResumenDia>();
        for (const e of this.encuestas()) {
            if (!e.encuestador_id || !e.created_at) continue;
            const fecha = e.created_at.substring(0, 10);
            if (desde) {
                const d = new Date(desde); d.setHours(0, 0, 0, 0);
                if (new Date(fecha) < d) continue;
            }
            if (hasta) {
                const h = new Date(hasta); h.setHours(23, 59, 59, 999);
                if (new Date(fecha) > h) continue;
            }
            const clave = `${e.encuestador_id}__${fecha}`;
            if (!mapa.has(clave)) {
                mapa.set(clave, {
                    encuestadorId: e.encuestador_id,
                    nombre: this.getEncuestadorLabel(e),
                    fecha,
                    total: 0
                });
            }
            mapa.get(clave)!.total++;
        }
        return Array.from(mapa.values()).sort((a, b) => {
            const byNombre = a.nombre.localeCompare(b.nombre);
            return byNombre !== 0 ? byNombre : a.fecha.localeCompare(b.fecha);
        });
    });

    resumenPorDepartamento = computed<ResumenDepartamento[]>(() => {
        const hogaresLookup = this.hogaresLookup();
        const mapa = new Map<string, ResumenDepartamento>();

        for (const encuesta of this.encuestas()) {
            const hogar = this.getHogarCompleto(encuesta);
            const departamentoId = hogar?.departamento_id ?? null;
            const clave = departamentoId != null ? `departamento-${departamentoId}` : 'departamento-sin';

            if (!mapa.has(clave)) {
                mapa.set(clave, {
                    departamentoId: departamentoId ?? clave,
                    departamento: this.getDepartamentoNombre(hogar),
                    total: 0
                });
            }

            mapa.get(clave)!.total++;
        }

        return Array.from(mapa.values()).sort((a, b) => b.total - a.total || a.departamento.localeCompare(b.departamento));
    });

    resumenPorMunicipio = computed<ResumenMunicipio[]>(() => {
        const hogaresLookup = this.hogaresLookup();
        const mapa = new Map<string, ResumenMunicipio>();

        for (const encuesta of this.encuestas()) {
            const hogar = this.getHogarCompleto(encuesta);
            const departamentoId = hogar?.departamento_id ?? 'sin';
            const municipioId = hogar?.municipio_id ?? null;
            const clave = municipioId != null ? `${departamentoId}-municipio-${municipioId}` : `${departamentoId}-municipio-sin`;

            if (!mapa.has(clave)) {
                mapa.set(clave, {
                    municipioId: municipioId ?? clave,
                    departamento: this.getDepartamentoNombre(hogar),
                    municipio: this.getMunicipioNombre(hogar),
                    total: 0
                });
            }

            mapa.get(clave)!.total++;
        }

        return Array.from(mapa.values()).sort((a, b) => {
            if (b.total !== a.total) {
                return b.total - a.total;
            }

            const byDepartamento = a.departamento.localeCompare(b.departamento);
            return byDepartamento !== 0 ? byDepartamento : a.municipio.localeCompare(b.municipio);
        });
    });

    resumenPorCentroPoblado = computed<ResumenCentroPoblado[]>(() => {
        const hogaresLookup = this.hogaresLookup();
        const mapa = new Map<string, ResumenCentroPoblado>();

        for (const encuesta of this.encuestas()) {
            const hogar = this.getHogarCompleto(encuesta);
            const departamentoId = hogar?.departamento_id ?? 'sin';
            const municipioId = hogar?.municipio_id ?? 'sin';
            const centroPobladoId = hogar?.centro_poblado_id ?? null;
            const clave = centroPobladoId != null ? `${departamentoId}-${municipioId}-centro-${centroPobladoId}` : `${departamentoId}-${municipioId}-centro-sin`;

            if (!mapa.has(clave)) {
                mapa.set(clave, {
                    centroPobladoId: centroPobladoId ?? clave,
                    departamento: this.getDepartamentoNombre(hogar),
                    municipio: this.getMunicipioNombre(hogar),
                    centroPoblado: this.getCentroPobladoNombre(hogar),
                    total: 0
                });
            }

            mapa.get(clave)!.total++;
        }

        return Array.from(mapa.values()).sort((a, b) => {
            if (b.total !== a.total) {
                return b.total - a.total;
            }

            const byDepartamento = a.departamento.localeCompare(b.departamento);
            if (byDepartamento !== 0) {
                return byDepartamento;
            }

            const byMunicipio = a.municipio.localeCompare(b.municipio);
            return byMunicipio !== 0 ? byMunicipio : a.centroPoblado.localeCompare(b.centroPoblado);
        });
    });

    encuestasFiltradas = computed(() => {
        const encuestadorId = this.filtroEncuestadorId();
        const hogarId = this.filtroHogarId();
        const desde = this.filtroFechaDesde();
        const hasta = this.filtroFechaHasta();
        const currentUserId = this.authService.getCurrentUserId();
        const restringido = this.authService.isRolRestringido();

        return this.encuestas().filter((encuesta) => {
            const byEncuestadorFiltro = !encuestadorId || encuesta.encuestador_id == encuestadorId;
            const byHogar = !hogarId || encuesta.hogar_id == hogarId;
            const byEncuestador = !restringido || encuesta.encuestador_id == currentUserId;

            let byFecha = true;
            if (encuesta.created_at && (desde || hasta)) {
                const fechaEncuesta = new Date(encuesta.created_at.substring(0, 10));
                if (desde) {
                    const d = new Date(desde);
                    d.setHours(0, 0, 0, 0);
                    if (fechaEncuesta < d) byFecha = false;
                }
                if (hasta && byFecha) {
                    const h = new Date(hasta);
                    h.setHours(23, 59, 59, 999);
                    if (fechaEncuesta > h) byFecha = false;
                }
            }

            return byEncuestadorFiltro && byHogar && byEncuestador && byFecha;
        });
    });

    encuestadorFilterOptions = computed(() => {
        const seen = new Set<number>();
        return this.encuestas()
            .filter((e) => !!e.encuestador_id)
            .filter((e) => {
                if (seen.has(e.encuestador_id!)) return false;
                seen.add(e.encuestador_id!);
                return true;
            })
            .map((e) => ({
                label: this.getEncuestadorLabel(e),
                value: e.encuestador_id!
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    });

    hogarFilterOptions = computed(() => {
        const seen = new Set<number>();
        return this.encuestas()
            .filter((e) => !!e.hogar_id && !!e.hogar)
            .filter((e) => {
                if (seen.has(e.hogar_id!)) return false;
                seen.add(e.hogar_id!);
                return true;
            })
            .map((e) => ({
                label: `${e.hogar!.cedula} - ${e.hogar!.nombre_persona}`,
                value: e.hogar_id!
            }));
    });

    constructor(
        private encuestaService: EncuestaService,
        private formularioService: FormularioService,
        private departamentoService: DepartamentoService,
        private municipioService: MunicipioService,
        private centroPobladoService: CentroPobladoService,
        private hogarService: HogarService,
        private respuestaService: RespuestaService,
        private valorOpcionRespuestaService: ValorOpcionRespuestaService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        void this.loadInitialData();
    }

    async loadInitialData() {
        this.loading.set(true);

        try {
            const [encuestas, formularios] = await Promise.all([
                firstValueFrom(this.encuestaService.getEncuestas()),
                firstValueFrom(this.formularioService.getFormularios())
            ]);

            this.encuestas.set(encuestas);
            this.formularios.set(formularios);
            await this.loadUbicacionData();
            if (encuestas.length > 0) {
                console.log('[Encuesta JSON ejemplo]', JSON.stringify(encuestas[0], null, 2));
            }
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las encuestas.', life: 4500 });
        } finally {
            this.loading.set(false);
        }
    }

    private async loadUbicacionData(showWarning = false): Promise<void> {
        const resultados = await Promise.allSettled([
            firstValueFrom(this.hogarService.getAll()),
            firstValueFrom(this.departamentoService.getAll()),
            firstValueFrom(this.municipioService.getAll()),
            firstValueFrom(this.centroPobladoService.getAll())
        ]);

        const [hogaresResult, departamentosResult, municipiosResult, centrosResult] = resultados;

        if (hogaresResult.status === 'fulfilled') {
            this.hogares.set(hogaresResult.value);
        }

        if (departamentosResult.status === 'fulfilled') {
            this.departamentos.set(departamentosResult.value);
        }

        if (municipiosResult.status === 'fulfilled') {
            this.municipios.set(municipiosResult.value);
        }

        if (centrosResult.status === 'fulfilled') {
            this.centrosPoblados.set(centrosResult.value);
        }

        if (showWarning && resultados.some((resultado) => resultado.status === 'rejected')) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Ubicación incompleta',
                detail: 'No se pudieron cargar todos los datos de ubicación para las encuestas.',
                life: 4500
            });
        }
    }

    async openResumenUbicacion(): Promise<void> {
        if (
            this.encuestas().some((encuesta) => !!encuesta.hogar_id) &&
            (!this.hogares().length || !this.departamentos().length || !this.municipios().length)
        ) {
            await this.loadUbicacionData(true);
        }

        this.resumenUbicacionDialogVisible = true;
    }

    async openDetail(encuesta: Encuesta) {
        if (!encuesta?.id) {
            return;
        }

        this.selectedEncuesta.set(encuesta);
        this.detailDialogVisible = true;
        this.detailLoading.set(true);
        this.respuestasDetalle.set([]);

        try {
            const [respuestas, valoresOpcion, formularioDetalle] = await Promise.all([
                this.getRespuestasCache(),
                this.getValoresCache(),
                encuesta.formulario_id ? firstValueFrom(this.formularioService.getFormularioById(encuesta.formulario_id)) : Promise.resolve(null)
            ]);

            const respuestasEncuesta = respuestas.filter((r) => r.encuesta_id == encuesta.id);

            const preguntaLookup = new Map<number, string>();
            const opcionLookup = new Map<number, OpcionPreguntaLookup>();

            (formularioDetalle?.secciones ?? []).forEach((seccion) => {
                (seccion.preguntas ?? []).forEach((pregunta: PreguntaFormulario) => {
                    if (pregunta.id) {
                        preguntaLookup.set(pregunta.id, pregunta.etiqueta || `Pregunta ${pregunta.id}`);
                    }
                    (pregunta.opciones ?? []).forEach((opcion) => {
                        if (opcion.id) {
                            opcionLookup.set(opcion.id, { id: opcion.id, etiqueta: opcion.etiqueta || `Opcion ${opcion.id}` });
                        }
                    });
                });
            });

            const detalle = respuestasEncuesta.map((respuesta) => {
                const seleccionadas = valoresOpcion
                    .filter((vo) => vo.respuesta_id == respuesta.id)
                    .map((vo) => {
                        const opcionId = vo.opcion_id ?? null;
                        if (!opcionId) return null;
                        return opcionLookup.get(opcionId)?.etiqueta || `Opcion ${opcionId}`;
                    })
                    .filter((label): label is string => !!label);

                return {
                    respuestaId: respuesta.id ?? null,
                    preguntaId: respuesta.pregunta_id ?? null,
                    preguntaEtiqueta: respuesta.pregunta_id ? preguntaLookup.get(respuesta.pregunta_id) || `Pregunta ${respuesta.pregunta_id}` : 'Pregunta sin ID',
                    valorTexto: (respuesta.valor_texto ?? '').trim(),
                    opcionesSeleccionadas: seleccionadas
                } as RespuestaDetalle;
            });

            this.respuestasDetalle.set(detalle);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle de la encuesta.', life: 4500 });
        } finally {
            this.detailLoading.set(false);
        }
    }

    descargarPdf(encuesta: Encuesta) {
        if (!encuesta.id) return;

        this.downloadingPdfId.set(encuesta.id);
        this.encuestaService.getPdf(encuesta.id).subscribe({
            next: (res: EncuestaPdfResponse) => {
                const byteString = atob(res.pdf_base64);
                const bytes = new Uint8Array(byteString.length);
                for (let i = 0; i < byteString.length; i++) {
                    bytes[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: res.content_type });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = res.file_name;
                link.click();
                URL.revokeObjectURL(url);
                this.downloadingPdfId.set(null);
            },
            error: () => {
                this.downloadingPdfId.set(null);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `No se pudo descargar el PDF de la encuesta #${encuesta.id}.`,
                    life: 4500
                });
            }
        });
    }

    confirmDeleteEncuesta(encuesta: Encuesta) {
        if (!encuesta.id) {
            return;
        }

        this.confirmationService.confirm({
            message: `Deseas eliminar la encuesta #${encuesta.id}? Esta accion no se puede deshacer.`,
            header: 'Confirmar eliminacion',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Si, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteEncuesta(encuesta);
            }
        });
    }

    private deleteEncuesta(encuesta: Encuesta) {
        if (!encuesta.id) {
            return;
        }

        this.encuestaService.deleteEncuesta(encuesta.id).subscribe({
            next: () => {
                this.encuestas.update((items) => items.filter((item) => item.id !== encuesta.id));

                if (this.selectedEncuesta()?.id == encuesta.id) {
                    this.selectedEncuesta.set(null);
                    this.respuestasDetalle.set([]);
                    this.detailDialogVisible = false;
                }

                this.messageService.add({
                    severity: 'success',
                    summary: 'Eliminada',
                    detail: `Encuesta #${encuesta.id} eliminada correctamente.`,
                    life: 3500
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo eliminar la encuesta.',
                    life: 4500
                });
            }
        });
    }

    private async getRespuestasCache(): Promise<Respuesta[]> {
        if (this.respuestasCache.length > 0) {
            return this.respuestasCache;
        }
        this.respuestasCache = await firstValueFrom(this.respuestaService.getRespuestas());
        return this.respuestasCache;
    }

    private async getValoresCache(): Promise<ValorOpcionRespuesta[]> {
        if (this.valoresOpcionCache.length > 0) {
            return this.valoresOpcionCache;
        }
        this.valoresOpcionCache = await firstValueFrom(this.valorOpcionRespuestaService.getValores());
        return this.valoresOpcionCache;
    }

    getFormularioLabel(formularioId?: number | null): string {
        if (!formularioId) return '-';
        const formulario = this.formularios().find((f) => f.id == formularioId);
        if (!formulario) return `ID ${formularioId}`;
        return `${formulario.codigo} - ${formulario.nombre}`;
    }

    getHogarLabel(encuesta?: Encuesta | null): string {
        if (!encuesta) return '-';
        const hogar = this.getHogarCompleto(encuesta) ?? encuesta.hogar;
        if (hogar) {
            return `${hogar.cedula ?? ''} - ${hogar.nombre_persona ?? ''}`.trim() || `ID ${encuesta.hogar_id}`;
        }
        return encuesta.hogar_id ? `ID ${encuesta.hogar_id}` : '-';
    }

    getDepartamentoLabel(encuesta?: Encuesta | null): string {
        if (!encuesta) return '-';
        const hogar = this.getHogarCompleto(encuesta);
        return hogar ? this.getDepartamentoNombre(hogar) : '-';
    }

    getMunicipioLabel(encuesta?: Encuesta | null): string {
        if (!encuesta) return '-';
        const hogar = this.getHogarCompleto(encuesta);
        return hogar ? this.getMunicipioNombre(hogar) : '-';
    }

    getCentroPobladoLabel(encuesta?: Encuesta | null): string {
        if (!encuesta) return '-';
        const hogar = this.getHogarCompleto(encuesta);
        return hogar ? this.getCentroPobladoNombre(hogar) : '-';
    }



    getEncuestadorLabel(encuesta?: Encuesta | null): string {
        if (!encuesta) return '-';
        // La relación puede venir como 'encuestador' o 'usuario' según el backend de Laravel
        const rel =  encuesta.usuario ?? null;
        if (rel) {
            const nombres = `${rel.nombres || rel.nombre || ''} ${rel.apellidos || rel.apellido || ''}`.trim();
            return nombres || `ID ${encuesta.encuestador_id}`;
        }
        return encuesta.encuestador_id ? `ID ${encuesta.encuestador_id}` : '-';
    }

    formatDateTime(raw: string | null | undefined): string {
        if (!raw) return '-';

        const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
        const date = new Date(normalized);
        if (Number.isNaN(date.getTime())) {
            return raw;
        }

        return date.toLocaleString();
    }



    estadoSeverity(estadoId?: number | null): 'success' | 'warn' | 'info' | 'secondary' | 'danger' | 'contrast' {
        if (estadoId == 1) return 'success';
        if (estadoId == 2) return 'warn';
        return 'secondary';
    }

    exportarExcelResumen(): void {
        const total = this.encuestas().length;
        const filas = this.resumenPorEncuestador().map((r) => ({
            Encuestador: r.nombre.toUpperCase(),
            Total: r.total,
            Porcentaje: total ? +((r.total / total) * 100).toFixed(1) : 0
        }));
        filas.push({ Encuestador: 'TOTAL', Total: total, Porcentaje: 100 });

        const ws = XLSX.utils.json_to_sheet(filas);
        ws['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 12 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
        XLSX.writeFile(wb, `resumen_encuestadores_${this.hoy()}.xlsx`);
    }

    exportarExcelResumenDia(): void {
        const filas = this.resumenPorDia().map((r) => ({
            Encuestador: r.nombre.toUpperCase(),
            Fecha: r.fecha,
            Total: r.total
        }));

        const ws = XLSX.utils.json_to_sheet(filas);
        ws['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 10 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Por Día');
        XLSX.writeFile(wb, `resumen_por_dia_${this.hoy()}.xlsx`);
    }

    exportarExcelResumenUbicacion(): void {
        const departamentos = this.resumenPorDepartamento().map((r) => ({
            Departamento: r.departamento.toUpperCase(),
            Total: r.total
        }));

        const municipios = this.resumenPorMunicipio().map((r) => ({
            Departamento: r.departamento.toUpperCase(),
            Municipio: r.municipio.toUpperCase(),
            Total: r.total
        }));

        const centros = this.resumenPorCentroPoblado().map((r) => ({
            Departamento: r.departamento.toUpperCase(),
            Municipio: r.municipio.toUpperCase(),
            'Centro Poblado': r.centroPoblado.toUpperCase(),
            Total: r.total
        }));

        const wb = XLSX.utils.book_new();

        const wsDepartamentos = XLSX.utils.json_to_sheet(departamentos);
        wsDepartamentos['!cols'] = [{ wch: 28 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsDepartamentos, 'Departamentos');

        const wsMunicipios = XLSX.utils.json_to_sheet(municipios);
        wsMunicipios['!cols'] = [{ wch: 28 }, { wch: 28 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsMunicipios, 'Municipios');

        const wsCentros = XLSX.utils.json_to_sheet(centros);
        wsCentros['!cols'] = [{ wch: 28 }, { wch: 28 }, { wch: 32 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsCentros, 'Centros');

        XLSX.writeFile(wb, `resumen_ubicacion_${this.hoy()}.xlsx`);
    }

    private hoy(): string {
        return new Date().toISOString().substring(0, 10);
    }

    limpiarFechas(): void {
        this.filtroFechaDesde.set(null);
        this.filtroFechaHasta.set(null);
    }

    private normalizarId(value: number | string | null | undefined): number | null {
        if (value == null || value === '') {
            return null;
        }

        const normalized = Number(value);
        return Number.isNaN(normalized) ? null : normalized;
    }

    private getHogarCompleto(encuesta?: Encuesta | null): Hogar | null {
        const hogarId = this.normalizarId(encuesta?.hogar_id);
        if (hogarId == null) {
            return null;
        }

        return this.hogaresLookup().get(hogarId) ?? null;
    }

    private getDepartamentoNombre(hogar?: Hogar | null): string {
        const nombre = hogar?.departamento?.nombre?.trim();
        if (nombre) {
            return nombre;
        }

        const departamentoId = hogar?.departamento_id ?? hogar?.municipio?.departamento_id ?? null;
        if (departamentoId != null) {
            return this.departamentosLookup().get(Number(departamentoId)) ?? `Departamento ID ${departamentoId}`;
        }

        return 'Sin departamento';
    }

    private getMunicipioNombre(hogar?: Hogar | null): string {
        const nombre = hogar?.municipio?.nombre?.trim();
        if (nombre) {
            return nombre;
        }

        const municipioId = hogar?.municipio_id ?? hogar?.centro_poblado?.municipio_id ?? null;
        if (municipioId != null) {
            return this.municipiosLookup().get(Number(municipioId)) ?? `Municipio ID ${municipioId}`;
        }

        return 'Sin municipio';
    }

    private getCentroPobladoNombre(hogar?: Hogar | null): string {
        const nombre = hogar?.centro_poblado?.nombre?.trim();
        if (nombre) {
            return nombre;
        }

        const centroPobladoId = hogar?.centro_poblado_id ?? null;
        if (centroPobladoId != null) {
            return this.centrosPobladosLookup().get(Number(centroPobladoId)) ?? `Centro ID ${centroPobladoId}`;
        }

        return 'Sin centro poblado';
    }

    openEditHogar(encuesta: Encuesta): void {
        if (!encuesta.hogar_id) {
            this.messageService.add({ severity: 'warn', summary: 'Sin hogar', detail: 'Esta encuesta no tiene hogar asociado.', life: 3000 });
            return;
        }
        this.savingHogar = false;
        this.hogarService.getById(encuesta.hogar_id).subscribe({
            next: (hogar) => {
                this.editHogar = { ...hogar };
                this.editHogarDialogVisible = true;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el hogar.', life: 4000 });
            }
        });
    }

    onDeptChange(deptId: number): void {
        if (this.editHogar) {
            this.editHogar.departamento_id = deptId;
            this.editHogar.municipio_id = 0;
            this.editHogar.centro_poblado_id = null;
        }
    }

    editarPreguntas(encuesta: Encuesta): void {
        if (!encuesta.id) return;
        void this.router.navigate(['/pages/encuestas', encuesta.id, 'editar']);
    }

    saveHogar(): void {
        const hogar = this.editHogar;
        if (!hogar?.id) return;

        if (!hogar.cedula?.trim() || !hogar.nombre_persona?.trim() || !hogar.departamento_id || !hogar.municipio_id) {
            this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Complete cédula, nombre, departamento y municipio.', life: 4000 });
            return;
        }

        this.savingHogar = true;
        const { id, created_at, updated_at, departamento, municipio, centro_poblado, ...payload } = hogar;
        this.hogarService.update(id, payload).subscribe({
            next: (updated) => {
                this.hogares.update((list) => {
                    const index = list.findIndex((item) => item.id == updated.id);
                    if (index === -1) {
                        return [...list, updated];
                    }

                    const next = [...list];
                    next[index] = { ...next[index], ...updated };
                    return next;
                });
                this.encuestas.update((list) =>
                    list.map((e) =>
                        e.hogar_id == updated.id
                            ? { ...e, hogar: { id: updated.id, cedula: updated.cedula, nombre_persona: updated.nombre_persona } }
                            : e
                    )
                );
                this.savingHogar = false;
                this.editHogarDialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Hogar actualizado correctamente.', life: 3500 });
            },
            error: () => {
                this.savingHogar = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el hogar.', life: 4500 });
            }
        });
    }
}
