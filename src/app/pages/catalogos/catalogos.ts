import { Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
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
import { Catalogo, CatalogoDetalle, CatalogoService } from '@/app/pages/service/catalogo.service';
import * as XLSX from 'xlsx';

interface CatalogoDetalleDraft extends Partial<CatalogoDetalle> {
    nombre?: string;
    valor?: string;
}

@Component({
    selector: 'app-catalogos',
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
        TooltipModule
    ],
    template: `
        <p-toast />

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total catálogos</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-book text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalCatalogos() }}</span>
            </div>

            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total detalles</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900">
                        <i class="pi pi-list text-emerald-600 dark:text-emerald-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{{ totalDetalles() }}</span>
            </div>

            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Con descripción</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900">
                        <i class="pi pi-align-left text-amber-600 dark:text-amber-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-amber-600 dark:text-amber-400">{{ totalConDescripcion() }}</span>
            </div>

            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Detalles en edición</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900">
                        <i class="pi pi-pencil text-violet-600 dark:text-violet-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-violet-600 dark:text-violet-400">{{ totalDetallesEditor() }}</span>
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
                    (onClick)="deleteSelectedCatalogos()"
                    [disabled]="!selectedCatalogos || !selectedCatalogos.length || saving()"
                />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="catalogos()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['id', 'nombre', 'codigo', 'descripcion']"
            dataKey="id"
            [(selection)]="selectedCatalogos"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} catálogos"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '70rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between gap-3">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Catálogos</h5>
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
                    <th pSortableColumn="nombre" style="min-width: 16rem">Nombre <p-sortIcon field="nombre" /></th>
                    <th pSortableColumn="codigo" style="min-width: 12rem">Código <p-sortIcon field="codigo" /></th>
                    <th pSortableColumn="descripcion" style="min-width: 22rem">Descripción <p-sortIcon field="descripcion" /></th>
                    <th style="min-width: 10rem">Detalles</th>
                    <th pSortableColumn="updated_at" style="min-width: 12rem">Actualizado <p-sortIcon field="updated_at" /></th>
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
                    <th>
                        <p-columnFilter type="text" field="codigo" placeholder="Buscar código" ariaLabel="Filter Código" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="descripcion" placeholder="Buscar descripción" ariaLabel="Filter Descripción" />
                    </th>
                    <th></th>
                    <th></th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-catalogo>
                <tr>
                    <td style="width: 3rem"><p-tableCheckbox [value]="catalogo" /></td>
                    <td>{{ catalogo.id }}</td>
                    <td class="font-medium">{{ catalogo.nombre }}</td>
                    <td><span class="font-mono uppercase">{{ catalogo.codigo }}</span></td>
                    <td>{{ catalogo.descripcion || 'Sin descripción' }}</td>
                    <td>{{ catalogo.detalles?.length || 0 }}</td>
                    <td>{{ formatDate(catalogo.updated_at) }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editCatalogo(catalogo)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteCatalogo(catalogo)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="8" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron catálogos.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="catalogoDialog" [style]="{ width: '980px' }" [header]="dialogTitle" [modal]="true" [blockScroll]="false" [closable]="!saving()" (onHide)="hideDialog()">
            <ng-template #content>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
                    <div class="flex flex-col gap-5">
                        <div>
                            <label for="catalogo_nombre" class="block font-semibold mb-2">
                                Nombre <span class="text-red-500">*</span>
                            </label>
                            <input type="text" pInputText id="catalogo_nombre" [(ngModel)]="catalogo.nombre" placeholder="Ej. Tipos de documento" maxlength="150" fluid autofocus />
                            @if (submitted && !catalogo.nombre?.trim()) {
                                <small class="text-red-500">El nombre es requerido.</small>
                            }
                        </div>

                        <div>
                            <label for="catalogo_descripcion" class="block font-semibold mb-2">Descripción</label>
                            <textarea id="catalogo_descripcion" pTextarea [(ngModel)]="catalogo.descripcion" rows="5" placeholder="Describe el propósito del catálogo" fluid></textarea>
                        </div>

                        <div class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                            <i class="pi" [ngClass]="catalogo.id ? 'pi-sync' : 'pi-plus-circle'"></i>
                            <span>{{ catalogo.id ? ('ID ' + catalogo.id) : 'Registro nuevo' }}</span>
                        </div>
                    </div>

                    <div class="border border-surface-200 dark:border-surface-700 rounded-xl p-5 bg-surface-50 dark:bg-surface-900/30">
                        <div class="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h4 class="m-0 font-semibold">Detalle del catálogo</h4>
                                <small class="text-surface-500 dark:text-surface-400">Agrega los valores que pertenecen al catálogo actual.</small>
                            </div>
                            @if (editingDetalleIndex !== null) {
                                <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                                    Editando detalle
                                </span>
                            }
                        </div>

                        <div class="mb-4">
                            <label for="detalle_nombre" class="block font-semibold mb-2">
                                Nombre <span class="text-red-500">*</span>
                            </label>
                            <input type="text" pInputText id="detalle_nombre" [(ngModel)]="detalleDraft.nombre" placeholder="Ej. Cédula de ciudadanía" maxlength="150" fluid />
                            @if (detalleSubmitted && !detalleDraft.nombre?.trim()) {
                                <small class="text-red-500">El nombre del detalle es requerido.</small>
                            }
                        </div>

                        <div class="flex flex-wrap gap-2 mb-5">
                            <p-button [label]="editingDetalleIndex == null ? 'Agregar detalle' : 'Actualizar detalle'" icon="pi pi-plus" (onClick)="upsertDetalle()" />
                            @if (editingDetalleIndex !== null) {
                                <p-button label="Cancelar edición" icon="pi pi-times" severity="secondary" outlined (onClick)="resetDetalleDraft()" />
                            }
                        </div>

                        <div class="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden bg-surface-0 dark:bg-surface-900">
                            <div class="px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between gap-3 bg-surface-50 dark:bg-surface-900/20">
                                <div>
                                    <h4 class="m-0 font-semibold">Detalles agregados</h4>
                                    <small class="text-surface-500 dark:text-surface-400">Estos registros se sincronizan al guardar el catálogo.</small>
                                </div>
                                <span class="text-sm font-medium text-surface-500 dark:text-surface-400">{{ detalleDrafts.length }} item(s)</span>
                            </div>

                            <p-table [value]="detalleDrafts" [tableStyle]="{ 'min-width': '38rem' }">
                                <ng-template #header>
                                    <tr>
                                        <th style="min-width: 16rem">Nombre</th>
                                        <th style="min-width: 10rem">Valor</th>
                                        <th style="min-width: 10rem">Estado</th>
                                        <th style="width: 8rem"></th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-detalle let-rowIndex="rowIndex">
                                    <tr>
                                        <td>{{ detalle.nombre }}</td>
                                        <td><span class="font-mono">{{ detalle.valor }}</span></td>
                                        <td>
                                            <span
                                                class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                                                [ngClass]="detalle.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'"
                                            >
                                                {{ detalle.id ? 'Persistido' : 'Nuevo' }}
                                            </span>
                                        </td>
                                        <td>
                                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editDetalle(rowIndex)" pTooltip="Editar detalle" tooltipPosition="top" />
                                            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="confirmRemoveDetalle(rowIndex)" pTooltip="Quitar detalle" tooltipPosition="top" />
                                        </td>
                                    </tr>
                                </ng-template>
                                <ng-template #emptymessage>
                                    <tr>
                                        <td colspan="4" class="text-center py-8 text-surface-400">
                                            Agrega al menos un detalle si este catálogo requiere opciones predefinidas.
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveCatalogo()" [loading]="saving()" [disabled]="editorLoading()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Catalogos implements OnInit {
    catalogoDialog = false;
    dialogTitle = 'Nuevo catálogo';

    catalogos = signal<Catalogo[]>([]);
    loading = signal(false);
    saving = signal(false);
    editorLoading = signal(false);

    catalogo: Partial<Catalogo> = {};
    selectedCatalogos: Catalogo[] | null = null;
    detalleDraft: CatalogoDetalleDraft = {};
    detalleDrafts: CatalogoDetalleDraft[] = [];
    removedDetalleIds: number[] = [];
    editingDetalleIndex: number | null = null;
    submitted = false;
    detalleSubmitted = false;

    totalCatalogos = computed(() => this.catalogos().length);
    totalDetalles = computed(() => this.catalogos().reduce((count, catalogo) => count + (catalogo.detalles?.length ?? 0), 0));
    totalConDescripcion = computed(() => this.catalogos().filter((catalogo) => !!catalogo.descripcion?.trim()).length);
    totalDetallesEditor = computed(() => this.detalleDrafts.length);

    @ViewChild('dt') dt!: Table;

    constructor(
        private catalogoService: CatalogoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.resetEditor();
        void this.loadCatalogos();
    }

    async loadCatalogos() {
        this.loading.set(true);
        try {
            const data = await firstValueFrom(this.catalogoService.getAll());
            this.catalogos.set(data);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los catálogos.', life: 4000 });
        } finally {
            this.loading.set(false);
        }
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.resetEditor();
        this.dialogTitle = 'Nuevo catálogo';
        this.catalogoDialog = true;
    }

    resetEditor() {
        this.catalogo = { descripcion: null };
        this.detalleDrafts = [];
        this.removedDetalleIds = [];
        this.submitted = false;
        this.resetDetalleDraft();
    }

    hideDialog() {
        this.catalogoDialog = false;
        this.resetEditor();
    }

    resetDetalleDraft() {
        this.detalleDraft = {};
        this.editingDetalleIndex = null;
        this.detalleSubmitted = false;
    }

    async editCatalogo(catalogo: Catalogo) {
        this.editorLoading.set(true);
        try {
            const fullCatalogo = await firstValueFrom(this.catalogoService.getById(catalogo.id!));
            this.dialogTitle = 'Editar catálogo';
            this.catalogo = {
                id: fullCatalogo.id,
                nombre: fullCatalogo.nombre,
                codigo: fullCatalogo.codigo,
                descripcion: fullCatalogo.descripcion ?? null
            };
            this.detalleDrafts = (fullCatalogo.detalles ?? []).map((detalle) => ({ ...detalle }));
            this.removedDetalleIds = [];
            this.submitted = false;
            this.resetDetalleDraft();
            this.catalogoDialog = true;
        } catch (err) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(err, 'No se pudo cargar el catálogo.'), life: 5000 });
        } finally {
            this.editorLoading.set(false);
        }
    }

    upsertDetalle() {
        this.detalleSubmitted = true;

        const nombre = this.detalleDraft.nombre?.trim().toUpperCase();

        if (!nombre) {
            return;
        }

        const payload: CatalogoDetalleDraft = {
            ...this.detalleDraft,
            nombre,
            valor: this.detalleDraft.valor?.trim() || this.buildCodeFromText(nombre)
        };

        if (this.editingDetalleIndex !== null) {
            this.detalleDrafts = this.detalleDrafts.map((item, index) => (index == this.editingDetalleIndex ? payload : item));
        } else {
            this.detalleDrafts = [...this.detalleDrafts, payload];
        }

        this.resetDetalleDraft();
    }

    editDetalle(index: number) {
        this.detalleDraft = { ...this.detalleDrafts[index] };
        this.editingDetalleIndex = index;
        this.detalleSubmitted = false;
    }

    confirmRemoveDetalle(index: number) {
        const detalle = this.detalleDrafts[index];

        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el detalle <strong>${detalle.nombre || detalle.valor || 'seleccionado'}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.removeDetalle(index);
            }
        });
    }

    removeDetalle(index: number) {
        const detalle = this.detalleDrafts[index];
        if (detalle.id) {
            this.removedDetalleIds = [...this.removedDetalleIds, detalle.id];
        }

        this.detalleDrafts = this.detalleDrafts.filter((_, rowIndex) => rowIndex !== index);

        if (this.editingDetalleIndex == index) {
            this.resetDetalleDraft();
        } else if (this.editingDetalleIndex !== null && this.editingDetalleIndex > index) {
            this.editingDetalleIndex--;
        }
    }

    async saveCatalogo() {
        this.submitted = true;

        const nombre = this.catalogo.nombre?.trim().toUpperCase();
        const codigo = this.catalogo.codigo?.trim().toUpperCase() || (nombre ? this.buildCodeFromText(nombre) : '');
        const isEdit = !!this.catalogo.id;

        if (!nombre) {
            return;
        }

        this.saving.set(true);

        try {
            const payload: Partial<Catalogo> = {
                nombre,
                codigo,
                descripcion: this.catalogo.descripcion?.trim() || null
            };

            const savedCatalogo = this.catalogo.id
                ? await firstValueFrom(this.catalogoService.update(this.catalogo.id, payload))
                : await firstValueFrom(this.catalogoService.create(payload));

            await this.syncDetalles(savedCatalogo.id!);

            const refreshedCatalogo = await firstValueFrom(this.catalogoService.getById(savedCatalogo.id!));
            this.upsertCatalogoInList(refreshedCatalogo);
            this.catalogo = {
                id: refreshedCatalogo.id,
                nombre: refreshedCatalogo.nombre,
                codigo: refreshedCatalogo.codigo,
                descripcion: refreshedCatalogo.descripcion ?? null
            };
            this.detalleDrafts = (refreshedCatalogo.detalles ?? []).map((detalle) => ({ ...detalle }));
            this.removedDetalleIds = [];
            this.resetDetalleDraft();
            this.selectedCatalogos = null;
            this.catalogoDialog = false;

            this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: isEdit ? 'Catálogo actualizado.' : 'Catálogo creado.',
                life: 3000
            });

            this.resetEditor();
        } catch (err) {
            await this.loadCatalogos();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(err, 'No se pudo guardar el catálogo.'), life: 5000 });
        } finally {
            this.saving.set(false);
        }
    }

    deleteCatalogo(catalogo: Catalogo) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar <strong>${catalogo.nombre}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                void this.performDeleteCatalogo(catalogo.id!);
            }
        });
    }

    deleteSelectedCatalogos() {
        if (!this.selectedCatalogos?.length) return;

        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar los <strong>${this.selectedCatalogos.length}</strong> catálogos seleccionados?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                void this.performDeleteSelectedCatalogos();
            }
        });
    }

    exportExcel() {
        const data = this.catalogos().map((catalogo) => ({
            ID: catalogo.id,
            Nombre: catalogo.nombre,
            Codigo: catalogo.codigo,
            Descripcion: catalogo.descripcion || '',
            TotalDetalles: catalogo.detalles?.length || 0,
            Detalles: (catalogo.detalles ?? []).map((detalle) => `${detalle.nombre} (${detalle.valor})`).join(', ')
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalogos');
        worksheet['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 18 }, { wch: 40 }, { wch: 14 }, { wch: 50 }];
        XLSX.writeFile(workbook, `Catalogos_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    formatDate(value?: string): string {
        if (!value) return 'Sin fecha';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    }

    private async syncDetalles(catalogoId: number) {
        for (const detalleId of this.removedDetalleIds) {
            await firstValueFrom(this.catalogoService.deleteDetalle(catalogoId, detalleId));
        }

        for (const detalle of this.detalleDrafts) {
            const nombre = detalle.nombre?.trim() || '';
            const payload = {
                nombre,
                valor: detalle.valor?.trim() || this.buildCodeFromText(nombre)
            };

            if (detalle.id) {
                await firstValueFrom(this.catalogoService.updateDetalle(catalogoId, detalle.id, payload));
            } else {
                await firstValueFrom(this.catalogoService.createDetalle(catalogoId, payload));
            }
        }

        this.removedDetalleIds = [];
    }

    private upsertCatalogoInList(catalogo: Catalogo) {
        this.catalogos.update((list) => {
            const index = list.findIndex((item) => item.id == catalogo.id);
            if (index == -1) {
                return [catalogo, ...list];
            }

            return list.map((item) => (item.id == catalogo.id ? catalogo : item));
        });
    }

    private async performDeleteCatalogo(catalogoId: number) {
        try {
            await firstValueFrom(this.catalogoService.delete(catalogoId));
            this.catalogos.update((list) => list.filter((item) => item.id !== catalogoId));

            if (this.catalogo.id == catalogoId) {
                this.resetEditor();
            }

            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Catálogo eliminado.', life: 3000 });
        } catch (err) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(err, 'No se pudo eliminar el catálogo.'), life: 5000 });
        }
    }

    private async performDeleteSelectedCatalogos() {
        if (!this.selectedCatalogos?.length) return;

        try {
            for (const catalogo of this.selectedCatalogos) {
                await firstValueFrom(this.catalogoService.delete(catalogo.id!));
            }

            const ids = new Set(this.selectedCatalogos.map((catalogo) => catalogo.id));
            this.catalogos.update((list) => list.filter((item) => !ids.has(item.id)));

            if (this.catalogo.id && ids.has(this.catalogo.id)) {
                this.resetEditor();
            }

            this.selectedCatalogos = null;
            this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Catálogos eliminados.', life: 3000 });
        } catch (err) {
            await this.loadCatalogos();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(err, 'No se pudieron eliminar todos los catálogos seleccionados.'), life: 5000 });
        }
    }

    private buildCodeFromText(value: string): string {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 100);
    }

    private extractErrorMessage(err: any, fallback: string): string {
        const validationErrors = err?.error?.errors;
        if (validationErrors && typeof validationErrors == 'object') {
            const messages = Object.values(validationErrors).flatMap((value) => (Array.isArray(value) ? value : [String(value)]));
            if (messages.length) {
                return messages.join(' ');
            }
        }

        return err?.error?.msg || err?.error?.message || fallback;
    }
}
