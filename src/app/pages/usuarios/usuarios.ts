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
import { DialogModule } from 'primeng/dialog';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Rol, RolService } from '@/app/pages/service/rol.service';
import { Estado, EstadoService } from '@/app/pages/service/estado.service';
import { Proyecto, ProyectoService } from '@/app/pages/service/proyecto.service';
import { ProyectoUsuario, ProyectoUsuarioService } from '@/app/pages/service/proyecto-usuario.service';
import { Usuario, UsuarioService } from '@/app/pages/service/usuario.service';
import { EstadoSelectComponent } from '@/app/shared/components/estado-select/estado-select.component';
import { ProyectoSelectComponent } from '@/app/shared/components/proyecto-select/proyecto-select.component';
import { RoleSelectComponent } from '@/app/shared/components/role-select/role-select.component';
import * as XLSX from 'xlsx';

interface UsuarioProyectoDraft {
    id?: number;
    proyecto_id: number | null;
    usuario_id?: number;
    estado_id: number | null;
}

@Component({
    selector: 'app-usuarios',
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
        DialogModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        TooltipModule,
        EstadoSelectComponent,
        ProyectoSelectComponent,
        RoleSelectComponent
    ],
    template: `
        <p-toast />

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Total Usuarios</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                        <i class="pi pi-user text-blue-600 dark:text-blue-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalUsuarios() }}</span>
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
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Con Proyectos</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900">
                        <i class="pi pi-briefcase text-amber-600 dark:text-amber-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-amber-600 dark:text-amber-400">{{ totalUsuariosConProyectos() }}</span>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5 flex flex-col gap-2 shadow-sm">
                <div class="flex items-center justify-between">
                    <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Roles Distintos</span>
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900">
                        <i class="pi pi-users text-purple-600 dark:text-purple-300 text-lg"></i>
                    </span>
                </div>
                <span class="text-4xl font-bold text-purple-600 dark:text-purple-400">{{ totalRolesAsignados() }}</span>
            </div>
        </div>

        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                <p-button severity="secondary" label="Eliminar" icon="pi pi-trash" outlined (onClick)="deleteSelectedUsuarios()" [disabled]="!selectedUsuarios || !selectedUsuarios.length" />
            </ng-template>
            <ng-template #end>
                <p-button label="Exportar Excel" icon="pi pi-file-excel" severity="success" (onClick)="exportExcel()" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [value]="usuarios()"
            [rows]="10"
            [paginator]="true"
            [globalFilterFields]="['nombres', 'apellidos', 'numero_documento', 'email']"
            dataKey="id"
            [(selection)]="selectedUsuarios"
            [rowHover]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="loading()"
            filterDisplay="row"
            [tableStyle]="{ 'min-width': '78rem' }"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between gap-3">
                    <h5 class="m-0 font-semibold text-lg">Gestión de Usuarios</h5>
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search" />
                        <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                    </p-iconfield>
                </div>
            </ng-template>

            <ng-template #header>
                <tr>
                    <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
                    <th pSortableColumn="numero_documento" style="min-width: 10rem">Documento <p-sortIcon field="numero_documento" /></th>
                    <th pSortableColumn="nombres" style="min-width: 16rem">Usuario <p-sortIcon field="nombres" /></th>
                    <th pSortableColumn="email" style="min-width: 18rem">Email <p-sortIcon field="email" /></th>
                    <th style="min-width: 12rem">Rol</th>
                    <th style="min-width: 10rem">Estado</th>
                    <th style="min-width: 10rem">Firma cargada</th>
                    <th style="min-width: 10rem">Proyectos</th>
                    <th style="min-width: 9rem"></th>
                </tr>
                <tr>
                    <th></th>
                    <th>
                        <p-columnFilter type="text" field="numero_documento" placeholder="Buscar documento" ariaLabel="Filter Documento" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="nombres" placeholder="Buscar usuario" ariaLabel="Filter Usuario" />
                    </th>
                    <th>
                        <p-columnFilter type="text" field="email" placeholder="Buscar email" ariaLabel="Filter Email" />
                    </th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                </tr>
            </ng-template>

            <ng-template #body let-usuario>
                <tr>
                    <td style="width: 3rem"><p-tableCheckbox [value]="usuario" /></td>
                    <td>{{ usuario.numero_documento }}</td>
                    <td>
                        <div class="font-medium">{{ usuario.nombres }} {{ usuario.apellidos }}</div>
                    </td>
                    <td>{{ usuario.email }}</td>
                    <td>{{ getRolNombre(usuario.rol_id) }}</td>
                    <td>{{ getEstadoNombre(usuario.estado_id) }}</td>
                    <td>
                        <span
                            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                            [ngClass]="isFirmaCargada(usuario) ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'"
                        >
                            {{ getFirmaCargadaLabel(usuario) }}
                        </span>
                    </td>
                    <td>{{ getCantidadProyectosUsuario(usuario.id) }}</td>
                    <td>
                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editUsuario(usuario)" pTooltip="Editar" tooltipPosition="top" />
                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteUsuario(usuario)" pTooltip="Eliminar" tooltipPosition="top" />
                    </td>
                </tr>
            </ng-template>

            <ng-template #emptymessage>
                <tr>
                    <td colspan="8" class="text-center py-10 text-surface-400">
                        <i class="pi pi-inbox text-4xl mb-3 block"></i>
                        No se encontraron usuarios.
                    </td>
                </tr>
            </ng-template>
        </p-table>

        <p-dialog [(visible)]="usuarioDialog" [style]="{ width: '980px' }" [header]="dialogTitle" [modal]="true">
            <ng-template #content>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
                    <div class="flex flex-col gap-5">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="nombres" class="block font-semibold mb-2">Nombres <span class="text-red-500">*</span></label>
                                <input type="text" pInputText id="nombres" [(ngModel)]="usuario.nombres" placeholder="Juan" maxlength="120" fluid autofocus />
                                @if (submitted && !usuario.nombres?.trim()) {
                                    <small class="text-red-500">Los nombres son requeridos.</small>
                                }
                            </div>
                            <div>
                                <label for="apellidos" class="block font-semibold mb-2">Apellidos <span class="text-red-500">*</span></label>
                                <input type="text" pInputText id="apellidos" [(ngModel)]="usuario.apellidos" placeholder="Pérez" maxlength="120" fluid />
                                @if (submitted && !usuario.apellidos?.trim()) {
                                    <small class="text-red-500">Los apellidos son requeridos.</small>
                                }
                            </div>
                            <div>
                                <label for="numero_documento" class="block font-semibold mb-2">Número de documento <span class="text-red-500">*</span></label>
                                <input type="text" pInputText id="numero_documento" [(ngModel)]="usuario.numero_documento" placeholder="12345678" maxlength="30" fluid />
                                @if (submitted && !usuario.numero_documento?.trim()) {
                                    <small class="text-red-500">El número de documento es requerido.</small>
                                }
                            </div>
                            <div>
                                <label for="email" class="block font-semibold mb-2">Email <span class="text-red-500">*</span></label>
                                <input type="email" pInputText id="email" [(ngModel)]="usuario.email" placeholder="juan@example.com" maxlength="150" fluid />
                                @if (submitted && !usuario.email?.trim()) {
                                    <small class="text-red-500">El email es requerido.</small>
                                }
                            </div>
                            <div>
                                <label for="rol_id" class="block font-semibold mb-2">Rol <span class="text-red-500">*</span></label>
                                <app-role-select [(ngModel)]="usuario.rol_id" />
                                @if (submitted && !usuario.rol_id) {
                                    <small class="text-red-500">El rol es requerido.</small>
                                }
                            </div>
                            <div>
                                <label for="estado_id" class="block font-semibold mb-2">Estado</label>
                                <app-estado-select [(ngModel)]="usuario.estado_id" />
                            </div>
                            <div class="md:col-span-2">
                                <label for="password" class="block font-semibold mb-2">
                                    {{ usuario.id ? 'Contraseña (opcional)' : 'Contraseña *' }}
                                </label>
                                <input type="password" pInputText id="password" [(ngModel)]="usuario.password" placeholder="********" maxlength="120" fluid />
                                @if (submitted && !usuario.id && !usuario.password?.trim()) {
                                    <small class="text-red-500">La contraseña es requerida al crear el usuario.</small>
                                }
                            </div>

                            <div class="md:col-span-2 border border-surface-200 dark:border-surface-700 rounded-lg p-4">
                                <div class="mb-3">
                                    <label class="block font-semibold mb-2">Firma cargada</label>
                                    <input type="text" pInputText [ngModel]="getFirmaCargadaLabel(usuario)" readonly fluid />
                                </div>

                                <div class="flex items-center justify-between mb-2">
                                    <label class="block font-semibold">Firma (imagen)</label>
                                    @if (firmaPreviewUrl) {
                                        <button pButton type="button" class="p-button-sm p-button-text p-button-danger" label="Quitar" (click)="removeFirmaSelection()"></button>
                                    }
                                </div>

                                <input #firmaInput type="file" accept="image/*" capture="camera" class="hidden" (change)="onFirmaSelected($event)" />

                                <div class="flex items-center gap-2 mb-3">
                                    <button pButton type="button" class="p-button-sm" icon="pi pi-image" label="Seleccionar imagen" (click)="firmaInput.click()"></button>
                                    @if (firmaFile) {
                                        <small class="text-surface-500 dark:text-surface-400">{{ firmaFile.name }}</small>
                                    }
                                </div>

                                @if (firmaPreviewUrl) {
                                    <div class="rounded border border-surface-200 dark:border-surface-700 p-2 inline-block bg-white">
                                        <img [src]="firmaPreviewUrl" alt="Vista previa firma" class="max-h-36 max-w-full object-contain" />
                                    </div>
                                } @else {
                                    <small class="text-surface-500 dark:text-surface-400">No hay firma seleccionada.</small>
                                }
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-4 border border-surface-200 dark:border-surface-700 rounded-xl p-4 bg-surface-50 dark:bg-surface-900/30">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <h4 class="m-0 font-semibold">Asignación a proyectos</h4>
                                <small class="text-surface-500 dark:text-surface-400">Opcional. Un usuario puede pertenecer a varios proyectos.</small>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="proyecto_usuario" class="block font-semibold mb-2">Proyecto</label>
                                <app-proyecto-select [(ngModel)]="proyectoUsuarioDraft.proyecto_id" />
                            </div>
                            <div>
                                <label for="estado_proyecto_usuario" class="block font-semibold mb-2">Estado</label>
                                <app-estado-select [(ngModel)]="proyectoUsuarioDraft.estado_id" />
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <p-button [label]="editingProyectoUsuarioIndex === null ? 'Agregar proyecto' : 'Actualizar proyecto'" icon="pi pi-plus" (click)="upsertProyectoUsuario()" />
                            @if (editingProyectoUsuarioIndex !== null) {
                                <p-button label="Cancelar edición" icon="pi pi-times" severity="secondary" outlined (click)="cancelProyectoUsuarioEdition()" />
                            }
                        </div>

                        <p-table [value]="usuarioProyectos" dataKey="id" [tableStyle]="{ 'min-width': '28rem' }">
                            <ng-template #header>
                                <tr>
                                    <th>Proyecto</th>
                                    <th>Estado</th>
                                    <th style="width: 7rem"></th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-relacion let-rowIndex="rowIndex">
                                <tr>
                                    <td>{{ getProyectoNombre(relacion.proyecto_id) }}</td>
                                    <td>{{ getEstadoNombre(relacion.estado_id) }}</td>
                                    <td>
                                        <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editProyectoUsuarioRow(rowIndex)" pTooltip="Editar" tooltipPosition="top" />
                                        <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="removeProyectoUsuarioRow(rowIndex)" pTooltip="Eliminar" tooltipPosition="top" />
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template #emptymessage>
                                <tr>
                                    <td colspan="3" class="text-center py-6 text-surface-400">
                                        El usuario no tiene proyectos asignados.
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="hideDialog()" [disabled]="saving()" />
                <p-button label="Guardar" icon="pi pi-check" (click)="saveUsuario()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" />
    `,
    providers: [MessageService, ConfirmationService]
})
export class Usuarios implements OnInit {
    usuarioDialog = false;
    dialogTitle = 'Nuevo Usuario';

    usuarios = signal<Usuario[]>([]);
    roles = signal<Rol[]>([]);
    estados = signal<Estado[]>([]);
    proyectos = signal<Proyecto[]>([]);
    relaciones = signal<ProyectoUsuario[]>([]);
    loading = signal(false);
    saving = signal(false);

    usuario: Partial<Usuario> = {};
    selectedUsuarios: Usuario[] | null = null;
    submitted = false;
    firmaFile: File | null = null;
    firmaPreviewUrl = '';
    removeFirma = false;

    usuarioProyectos: UsuarioProyectoDraft[] = [];
    proyectoUsuarioDraft: UsuarioProyectoDraft = { proyecto_id: null, estado_id: 1 };
    editingProyectoUsuarioIndex: number | null = null;

    totalUsuarios = computed(() => this.usuarios().length);
    totalActivos = computed(() => this.usuarios().filter((usuario) => usuario.estado_id === 1).length);
    totalUsuariosConProyectos = computed(() => new Set(this.relaciones().map((relacion) => relacion.usuario_id)).size);
    totalRolesAsignados = computed(() => new Set(this.usuarios().map((usuario) => usuario.rol_id)).size);

    @ViewChild('dt') dt!: Table;

    constructor(
        private usuarioService: UsuarioService,
        private rolService: RolService,
        private estadoService: EstadoService,
        private proyectoService: ProyectoService,
        private proyectoUsuarioService: ProyectoUsuarioService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        void this.loadData();
    }

    async loadData() {
        this.loading.set(true);
        try {
            const [usuarios, roles, estados, proyectos, relaciones] = await Promise.all([
                firstValueFrom(this.usuarioService.getAll()),
                firstValueFrom(this.rolService.getAll()),
                firstValueFrom(this.estadoService.getAll()),
                firstValueFrom(this.proyectoService.getAll()),
                firstValueFrom(this.proyectoUsuarioService.getAll())
            ]);

            this.usuarios.set(usuarios);
            this.roles.set(roles);
            this.estados.set(estados);
            this.proyectos.set(proyectos);
            this.relaciones.set(relaciones);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios y catálogos.', life: 4000 });
        } finally {
            this.loading.set(false);
        }
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.usuario = { estado_id: 1, password: '' };
        this.usuarioProyectos = [];
        this.firmaFile = null;
        this.firmaPreviewUrl = '';
        this.removeFirma = false;
        this.resetProyectoUsuarioDraft();
        this.submitted = false;
        this.dialogTitle = 'Nuevo Usuario';
        this.usuarioDialog = true;
    }

    editUsuario(usuario: Usuario) {
        this.usuario = { ...usuario, password: '' };
        this.usuarioProyectos = this.relaciones()
            .filter((relacion) => relacion.usuario_id === usuario.id)
            .map((relacion) => ({
                id: relacion.id,
                proyecto_id: relacion.proyecto_id,
                usuario_id: relacion.usuario_id,
                estado_id: relacion.estado_id
            }));
        this.firmaFile = null;
        this.firmaPreviewUrl = this.getFirmaFromUsuario(usuario);
        this.removeFirma = false;
        this.resetProyectoUsuarioDraft();
        this.submitted = false;
        this.dialogTitle = 'Editar Usuario';
        this.usuarioDialog = true;
    }

    hideDialog() {
        this.usuarioDialog = false;
        this.submitted = false;
        this.usuario = {};
        this.usuarioProyectos = [];
        this.firmaFile = null;
        this.firmaPreviewUrl = '';
        this.removeFirma = false;
        this.resetProyectoUsuarioDraft();
    }

    onFirmaSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Solo se permiten imágenes para la firma.', life: 3500 });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La firma no debe superar 2 MB.', life: 3500 });
            return;
        }

        this.firmaFile = file;
        this.removeFirma = false;
        this.firmaPreviewUrl = URL.createObjectURL(file);
        input.value = '';
    }

    removeFirmaSelection() {
        this.firmaFile = null;
        this.firmaPreviewUrl = '';
        this.removeFirma = true;
    }

    upsertProyectoUsuario() {
        if (!this.proyectoUsuarioDraft.proyecto_id) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona un proyecto para asignar.', life: 3000 });
            return;
        }

        const duplicateIndex = this.usuarioProyectos.findIndex(
            (relacion, index) => relacion.proyecto_id === this.proyectoUsuarioDraft.proyecto_id && index !== this.editingProyectoUsuarioIndex
        );

        if (duplicateIndex >= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El proyecto ya fue agregado para este usuario.', life: 3000 });
            return;
        }

        const relation: UsuarioProyectoDraft = {
            id: this.editingProyectoUsuarioIndex !== null ? this.usuarioProyectos[this.editingProyectoUsuarioIndex].id : undefined,
            usuario_id: this.usuario.id,
            proyecto_id: this.proyectoUsuarioDraft.proyecto_id,
            estado_id: this.proyectoUsuarioDraft.estado_id ?? 1
        };

        if (this.editingProyectoUsuarioIndex !== null) {
            this.usuarioProyectos.splice(this.editingProyectoUsuarioIndex, 1, relation);
        } else {
            this.usuarioProyectos = [...this.usuarioProyectos, relation];
        }

        this.resetProyectoUsuarioDraft();
    }

    editProyectoUsuarioRow(index: number) {
        const relation = this.usuarioProyectos[index];
        this.proyectoUsuarioDraft = {
            id: relation.id,
            usuario_id: relation.usuario_id,
            proyecto_id: relation.proyecto_id,
            estado_id: relation.estado_id
        };
        this.editingProyectoUsuarioIndex = index;
    }

    removeProyectoUsuarioRow(index: number) {
        this.usuarioProyectos = this.usuarioProyectos.filter((_, relationIndex) => relationIndex !== index);
        if (this.editingProyectoUsuarioIndex === index) {
            this.resetProyectoUsuarioDraft();
        }
    }

    cancelProyectoUsuarioEdition() {
        this.resetProyectoUsuarioDraft();
    }

    async saveUsuario() {
        this.submitted = true;

        if (!this.usuario.rol_id || !this.usuario.nombres?.trim() || !this.usuario.apellidos?.trim() || !this.usuario.numero_documento?.trim() || !this.usuario.email?.trim()) {
            return;
        }

        if (!this.usuario.id && !this.usuario.password?.trim()) {
            return;
        }

        const payload: Record<string, unknown> = {
            rol_id: this.usuario.rol_id,
            nombres: this.usuario.nombres.trim(),
            apellidos: this.usuario.apellidos.trim(),
            numero_documento: this.usuario.numero_documento.trim(),
            email: this.usuario.email.trim().toLowerCase(),
            estado_id: this.usuario.estado_id ?? 1
        };

        if (this.usuario.password?.trim()) {
            payload['password'] = this.usuario.password.trim();
        }

        if (this.removeFirma) {
            payload['firma'] = '';
            payload['eliminar_firma'] = true;
        }

        this.saving.set(true);

        try {
            const action = this.usuario.id ? 'actualizado' : 'creado';
            const saved = this.usuario.id
                ? this.firmaFile || this.removeFirma
                    ? await firstValueFrom(this.usuarioService.updateWithFormData(this.usuario.id, payload, this.firmaFile ?? undefined))
                    : await firstValueFrom(this.usuarioService.update(this.usuario.id, payload as Partial<Usuario>))
                : this.firmaFile
                  ? await firstValueFrom(this.usuarioService.createWithFormData(payload, this.firmaFile))
                  : await firstValueFrom(this.usuarioService.create(payload as Partial<Usuario>));

            await this.syncProyectoUsuarios(saved.id!);
            await this.loadData();

            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Usuario ${action}.`, life: 3000 });
            this.hideDialog();
        } catch (err) {
            await this.loadData();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(err, 'No se pudo guardar el usuario.'), life: 5000 });
        } finally {
            this.saving.set(false);
        }
    }

    deleteUsuario(usuario: Usuario) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar <strong>${usuario.nombres} ${usuario.apellidos}</strong>?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                void this.performDeleteUsuario(usuario.id!);
            }
        });
    }

    deleteSelectedUsuarios() {
        if (!this.selectedUsuarios?.length) return;

        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar los <strong>${this.selectedUsuarios.length}</strong> usuarios seleccionados?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                void this.performDeleteSelectedUsuarios();
            }
        });
    }

    exportExcel() {
        const data = this.usuarios().map((usuario) => ({
            ID: usuario.id,
            Documento: usuario.numero_documento,
            Nombres: usuario.nombres,
            Apellidos: usuario.apellidos,
            Email: usuario.email,
            Rol: this.getRolNombre(usuario.rol_id),
            Estado: this.getEstadoNombre(usuario.estado_id),
            FirmaCargada: this.getFirmaCargadaLabel(usuario),
            Proyectos: this.getCantidadProyectosUsuario(usuario.id)
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
        worksheet['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 12 }];
        XLSX.writeFile(workbook, `Usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    getRolNombre(rolId?: number | null): string {
        if (!rolId) return 'Sin rol';
        return this.roles().find((rol) => rol.id === rolId)?.nombre ?? `Rol #${rolId}`;
    }

    getEstadoNombre(estadoId?: number | null): string {
        if (!estadoId) return 'Sin estado';
        return this.estados().find((estado) => estado.id === estadoId)?.nombre ?? `Estado #${estadoId}`;
    }

    getProyectoNombre(proyectoId?: number | null): string {
        if (!proyectoId) return 'Sin proyecto';
        const proyecto = this.proyectos().find((item) => item.id === proyectoId);
        if (!proyecto) return `Proyecto #${proyectoId}`;
        return proyecto.codigo ? `${proyecto.codigo} - ${proyecto.nombre}` : proyecto.nombre;
    }

    getCantidadProyectosUsuario(usuarioId?: number): number {
        if (!usuarioId) return 0;
        return this.relaciones().filter((relacion) => relacion.usuario_id === usuarioId).length;
    }

    getFirmaCargadaLabel(usuario: Partial<Usuario>): string {
        const raw = usuario.firma_cargada;
        if (typeof raw === 'string') {
            const normalized = raw.trim().toUpperCase();
            if (normalized === 'SI') {
                return 'Si';
            }
            if (normalized === 'NO') {
                return 'No';
            }
        }

        if (typeof raw === 'boolean') {
            return raw ? 'Si' : 'No';
        }

        if (typeof raw === 'number') {
            return raw === 1 ? 'Si' : 'No';
        }

        const hasFirma = !!this.getFirmaFromUsuario(usuario);
        return hasFirma ? 'Si' : 'No';
    }

    isFirmaCargada(usuario: Partial<Usuario>): boolean {
        const raw = usuario.firma_cargada;
        if (typeof raw === 'string') {
            const normalized = raw.trim().toUpperCase();
            if (normalized === 'SI') {
                return true;
            }
            if (normalized === 'NO') {
                return false;
            }
        }

        if (typeof raw === 'boolean') {
            return raw;
        }

        if (typeof raw === 'number') {
            return raw === 1;
        }

        return !!this.getFirmaFromUsuario(usuario);
    }

    private resetProyectoUsuarioDraft() {
        this.proyectoUsuarioDraft = { proyecto_id: null, estado_id: 1 };
        this.editingProyectoUsuarioIndex = null;
    }

    private async syncProyectoUsuarios(usuarioId: number) {
        const originales = this.relaciones().filter((relacion) => relacion.usuario_id === usuarioId);
        const actuales = this.usuarioProyectos.map((relacion) => ({
            ...relacion,
            usuario_id: usuarioId,
            estado_id: relacion.estado_id ?? 1
        }));

        const toDelete = originales.filter((original) => !actuales.some((actual) => actual.id === original.id));
        const toCreate = actuales.filter((actual) => !actual.id);
        const toUpdate = actuales.filter((actual) => {
            if (!actual.id) return false;
            const original = originales.find((item) => item.id === actual.id);
            return !!original && (original.proyecto_id !== actual.proyecto_id || original.estado_id !== actual.estado_id);
        });

        await Promise.all([
            ...toDelete.map((relation) => firstValueFrom(this.proyectoUsuarioService.delete(relation.id!))),
            ...toCreate.map((relation) =>
                firstValueFrom(
                    this.proyectoUsuarioService.create({
                        proyecto_id: relation.proyecto_id!,
                        usuario_id: usuarioId,
                        estado_id: relation.estado_id ?? 1
                    })
                )
            ),
            ...toUpdate.map((relation) =>
                firstValueFrom(
                    this.proyectoUsuarioService.update(relation.id!, {
                        proyecto_id: relation.proyecto_id!,
                        usuario_id: usuarioId,
                        estado_id: relation.estado_id ?? 1
                    })
                )
            )
        ]);
    }

    private async performDeleteUsuario(usuarioId: number) {
        try {
            const relaciones = this.relaciones().filter((relacion) => relacion.usuario_id === usuarioId);
            await Promise.all(relaciones.map((relacion) => firstValueFrom(this.proyectoUsuarioService.delete(relacion.id!))));
            await firstValueFrom(this.usuarioService.delete(usuarioId));
            await this.loadData();
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado.', life: 3000 });
        } catch (err) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(err, 'No se pudo eliminar el usuario.'), life: 5000 });
        }
    }

    private async performDeleteSelectedUsuarios() {
        if (!this.selectedUsuarios?.length) return;

        try {
            for (const usuario of this.selectedUsuarios) {
                await this.performDeleteUsuarioSilently(usuario.id!);
            }
            await this.loadData();
            this.selectedUsuarios = null;
            this.messageService.add({ severity: 'success', summary: 'Eliminados', detail: 'Usuarios eliminados.', life: 3000 });
        } catch (err) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: this.extractErrorMessage(err, 'No se pudieron eliminar todos los usuarios seleccionados.'), life: 5000 });
        }
    }

    private async performDeleteUsuarioSilently(usuarioId: number) {
        const relaciones = this.relaciones().filter((relacion) => relacion.usuario_id === usuarioId);
        await Promise.all(relaciones.map((relacion) => firstValueFrom(this.proyectoUsuarioService.delete(relacion.id!))));
        await firstValueFrom(this.usuarioService.delete(usuarioId));
    }

    private extractErrorMessage(err: any, fallback: string): string {
        const validationErrors = err?.error?.errors;
        if (validationErrors && typeof validationErrors === 'object') {
            const messages = Object.values(validationErrors).flatMap((value) => (Array.isArray(value) ? value : [String(value)]));
            if (messages.length) {
                return messages.join(' ');
            }
        }

        return err?.error?.msg || err?.error?.message || fallback;
    }

    private getFirmaFromUsuario(usuario: Partial<Usuario>): string {
        const value =
            (typeof usuario.firma_url === 'string' && usuario.firma_url) ||
            (typeof usuario.firma === 'string' && usuario.firma) ||
            (typeof (usuario as any).firma_imagen === 'string' && (usuario as any).firma_imagen) ||
            (typeof (usuario as any).firma_image === 'string' && (usuario as any).firma_image) ||
            '';

        return value;
    }
}
