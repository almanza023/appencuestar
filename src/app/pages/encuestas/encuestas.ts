import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Encuesta, EncuestaService, EncuestaPdfResponse } from '@/app/pages/service/encuesta.service';
import { Formulario, FormularioService, PreguntaFormulario } from '@/app/pages/service/formulario.service';
import { Hogar, HogarService } from '@/app/pages/service/hogar.service';
import { Respuesta, RespuestaService } from '@/app/pages/service/respuesta.service';
import { Usuario, UsuarioService } from '@/app/pages/service/usuario.service';
import { ValorOpcionRespuesta, ValorOpcionRespuestaService } from '@/app/pages/service/valor-opcion-respuesta.service';
import { AuthService } from '@/app/core/services/auth.service';

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

@Component({
    selector: 'app-encuestas',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, SelectModule, DialogModule, ConfirmDialogModule, ToastModule],
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
                <div class="text-4xl font-bold mt-2 text-yellow-600 dark:text-yellow-400">{{ hogares().length }}</div>
            </div>
        </div>

        <div class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-4 mb-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block mb-2 font-semibold">Filtrar por Formulario</label>
                    <p-select
                        [options]="formularioFilterOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [ngModel]="filtroFormularioId()"
                        (ngModelChange)="filtroFormularioId.set($event)"
                        [showClear]="true"
                        appendTo="body"
                        placeholder="Todos los formularios"
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
            </div>
        </div>

        <p-table [value]="encuestasFiltradas()" [rows]="10" [paginator]="true" [loading]="loading()" dataKey="id" [tableStyle]="{ 'min-width': '76rem' }">
            <ng-template #header>
                <tr>
                    <th style="min-width: 6rem">Código</th>
                    <th style="min-width: 14rem">Hogar</th>
                    <th style="min-width: 14rem">Encuestador</th>
                    <th style="min-width: 12rem">Fecha y Hora</th>
                    <th style="min-width: 8rem">Estado</th>
                    <th style="min-width: 14rem">Acciones</th>
                </tr>
            </ng-template>

            <ng-template #body let-encuesta>
                <tr>
                    <td>{{ encuesta.id }}</td>
                    <td class="uppercase">{{ getHogarLabel(encuesta.hogar_id) }}</td>
                    <td class="uppercase">{{ getEncuestadorLabel(encuesta.encuestador_id) }}</td>
                    <td>{{ formatDateTime(encuesta.created_at) }}</td>
                    <td>
                        <p-tag [value]="estadoLabel(encuesta.estado_id)" [severity]="estadoSeverity(encuesta.estado_id)"></p-tag>
                    </td>
                    <td>
                        <div class="flex flex-wrap gap-2">
                            <p-button label="Ver Formulario y Respuestas" icon="pi pi-eye" [outlined]="true" (onClick)="openDetail(encuesta)"></p-button>
                            <p-button
                                label="Descargar PDF"
                                icon="pi pi-file-pdf"
                                severity="help"
                                [outlined]="true"
                                [loading]="downloadingPdfId() === encuesta.id"
                                (onClick)="descargarPdf(encuesta)"
                            ></p-button>
                            <p-button label="Eliminar" icon="pi pi-trash" severity="danger" [outlined]="true" (onClick)="confirmDeleteEncuesta(encuesta)"></p-button>
                        </div>
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="7" class="text-center py-10 text-surface-400">No hay encuestas para mostrar con los filtros seleccionados.</td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog
            [(visible)]="detailDialogVisible"
            [modal]="true"
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
                        <div class="text-base font-semibold uppercase">{{ getHogarLabel(selectedEncuesta()?.hogar_id || null) }}</div>
                    </div>
                    <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-3">
                        <div class="text-xs uppercase text-surface-500 mb-1">Encuestador</div>
                        <div class="text-base font-semibold uppercase">{{ getEncuestadorLabel(selectedEncuesta()?.encuestador_id || null) }}</div>
                    </div>
                    <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-3">
                        <div class="text-xs uppercase text-surface-500 mb-1">Estado</div>
                        <div class="text-base font-semibold">{{ estadoLabel(selectedEncuesta()?.estado_id || null) }}</div>
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
    usuarios = signal<Usuario[]>([]);
    loading = signal(false);

    filtroFormularioId = signal<number | null>(null);
    filtroHogarId = signal<number | null>(null);

    detailDialogVisible = false;
    detailLoading = signal(false);
    selectedEncuesta = signal<Encuesta | null>(null);
    respuestasDetalle = signal<RespuestaDetalle[]>([]);
    downloadingPdfId = signal<number | null>(null);

    private respuestasCache: Respuesta[] = [];
    private valoresOpcionCache: ValorOpcionRespuesta[] = [];

    encuestasFiltradas = computed(() => {
        const formularioId = this.filtroFormularioId();
        const hogarId = this.filtroHogarId();
        const currentUserId = this.authService.getCurrentUserId();
        const restringido = this.authService.isRolRestringido();

        return this.encuestas().filter((encuesta) => {
            const byFormulario = !formularioId || encuesta.formulario_id === formularioId;
            const byHogar = !hogarId || encuesta.hogar_id === hogarId;
            // Si el rol es restringido, solo muestra las encuestas del usuario logueado
            const byEncuestador = !restringido || encuesta.encuestador_id === currentUserId;
            return byFormulario && byHogar && byEncuestador;
        });
    });

    formularioFilterOptions = computed(() =>
        this.formularios()
            .filter((f) => !!f.id)
            .map((f) => ({
                label: `${f.codigo} - ${f.nombre}`,
                value: f.id!
            }))
    );

    hogarFilterOptions = computed(() =>
        this.hogares()
            .filter((h) => !!h.id)
            .map((h) => ({
                label: `${h.cedula} - ${h.nombre_persona}`,
                value: h.id!
            }))
    );

    constructor(
        private encuestaService: EncuestaService,
        private formularioService: FormularioService,
        private hogarService: HogarService,
        private usuarioService: UsuarioService,
        private respuestaService: RespuestaService,
        private valorOpcionRespuestaService: ValorOpcionRespuestaService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        void this.loadInitialData();
    }

    async loadInitialData() {
        this.loading.set(true);

        try {
            const [encuestas, formularios, hogares, usuarios] = await Promise.all([
                firstValueFrom(this.encuestaService.getEncuestas()),
                firstValueFrom(this.formularioService.getFormularios()),
                firstValueFrom(this.hogarService.getAll()),
                firstValueFrom(this.usuarioService.getAll())
            ]);

            this.encuestas.set(encuestas);
            this.formularios.set(formularios);
            this.hogares.set(hogares);
            this.usuarios.set(usuarios);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las encuestas.', life: 4500 });
        } finally {
            this.loading.set(false);
        }
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

            const respuestasEncuesta = respuestas.filter((r) => r.encuesta_id === encuesta.id);

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
                    .filter((vo) => vo.respuesta_id === respuesta.id)
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

                if (this.selectedEncuesta()?.id === encuesta.id) {
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
        const formulario = this.formularios().find((f) => f.id === formularioId);
        if (!formulario) return `ID ${formularioId}`;
        return `${formulario.codigo} - ${formulario.nombre}`;
    }

    getHogarLabel(hogarId?: number | null): string {
        if (!hogarId) return '-';
        const hogar = this.hogares().find((h) => h.id === hogarId);
        if (!hogar) return `ID ${hogarId}`;
        return `${hogar.cedula} - ${hogar.nombre_persona}`;
    }

    getEncuestadorLabel(encuestadorId?: number | null): string {
        if (!encuestadorId) return '-';
        const usuario = this.usuarios().find((u) => u.id === encuestadorId);
        if (!usuario) return `ID ${encuestadorId}`;
        const nombres = `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();
        if (!nombres) {
            return usuario.numero_documento || `ID ${encuestadorId}`;
        }
        return `${nombres} (${usuario.numero_documento})`;
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

    estadoLabel(estadoId?: number | null): string {
        if (estadoId === null || estadoId === undefined) return 'SIN ESTADO';
        switch (estadoId) {
            case 1:
                return 'ACTIVO';
            case 2:
                return 'INACTIVO';
            default:
                return `ESTADO ${estadoId}`;
        }
    }

    estadoSeverity(estadoId?: number | null): 'success' | 'warn' | 'info' | 'secondary' | 'danger' | 'contrast' {
        if (estadoId === 1) return 'success';
        if (estadoId === 2) return 'warn';
        return 'secondary';
    }
}
