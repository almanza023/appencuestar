import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { AuthService } from '@/app/core/services/auth.service';
import { Encuesta, EncuestaService } from '@/app/pages/service/encuesta.service';
import { Hogar, HogarService } from '@/app/pages/service/hogar.service';
import { Observacion, ObservacionService } from '@/app/pages/service/observacion.service';

type QuickAccess = {
    title: string;
    description: string;
    icon: string;
    route: string;
    color: string;
    bg: string;
};

type DashboardKpi = {
    label: string;
    value: string;
    hint: string;
};

type TopEncuestador = {
    nombre: string;
    encuestas: number;
    observaciones: number;
    total: number;
};

type ActividadDia = {
    fecha: string;
    encuestas: number;
    observaciones: number;
    total: number;
};

type GeoDistribucion = {
    nombre: string;
    total: number;
};

type GeoFuente = 'encuestas' | 'observaciones';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [RouterLink, ChartModule],
    styles: [`
        .dashboard-shell {
            max-width: 1100px;
            margin: 0 auto;
        }

        .dashboard-header {
            background: #ffffff;
            border: 1px solid #dce4ea;
            border-radius: 16px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .header-title {
            margin: 0;
            color: #1f2937;
            font-size: 1.6rem;
            font-weight: 700;
            line-height: 1.2;
        }

        .header-subtitle {
            margin: 0.35rem 0 0;
            color: #4b5563;
            font-size: 0.93rem;
        }

        .header-logo {
            width: 180px;
            border-radius: 12px;
            border: 1px solid #dce4ea;
            padding: 0.35rem 0.5rem;
            background: #ffffff;
            flex-shrink: 0;
        }

        .header-logo img {
            display: block;
            width: 100%;
            max-height: 3rem;
            object-fit: contain;
        }

        .section-card {
            background: #ffffff;
            border: 1px solid #dce4ea;
            border-radius: 16px;
            padding: 1rem;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(1, minmax(0, 1fr));
            gap: 0.75rem;
        }

        .kpi-card {
            border: 1px solid #dce4ea;
            border-radius: 12px;
            padding: 0.85rem 0.95rem;
            background: linear-gradient(180deg, #ffffff 0%, #f9fcf5 100%);
        }

        .kpi-value {
            margin: 0.35rem 0 0;
            font-size: 1.5rem;
            font-weight: 800;
            color: #1f2937;
        }

        .kpi-label {
            margin: 0;
            font-size: 0.8rem;
            color: #4b5563;
        }

        .kpi-hint {
            margin: 0.2rem 0 0;
            font-size: 0.75rem;
            color: #6b7280;
        }

        .mini-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.82rem;
        }

        .mini-table th,
        .mini-table td {
            border-bottom: 1px solid #e5edf2;
            padding: 0.55rem 0.4rem;
            text-align: left;
            vertical-align: top;
        }

        .mini-table th {
            font-size: 0.73rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            font-weight: 700;
        }

        .empty-state {
            border: 1px dashed #cfd9e2;
            border-radius: 12px;
            padding: 1rem;
            background: #fbfdff;
            color: #4b5563;
            font-size: 0.86rem;
        }

        .error-state {
            border: 1px solid #fecaca;
            background: #fef2f2;
            color: #991b1b;
            border-radius: 12px;
            padding: 0.75rem 0.9rem;
            font-size: 0.83rem;
        }

        .loading-state {
            color: #4b5563;
            font-size: 0.86rem;
        }

        .chart-shell {
            border: 1px solid #dce4ea;
            border-radius: 12px;
            padding: 0.6rem;
            background: #fcfef9;
            min-height: 260px;
        }

        .source-toggle {
            display: inline-flex;
            border: 1px solid #dce4ea;
            border-radius: 999px;
            overflow: hidden;
            background: #ffffff;
        }

        .source-toggle button {
            border: 0;
            background: transparent;
            padding: 0.35rem 0.75rem;
            font-size: 0.78rem;
            color: #4b5563;
            cursor: pointer;
        }

        .source-toggle button.active {
            background: #eafed9;
            color: #0f5f2b;
            font-weight: 700;
        }

        @media (min-width: 768px) {
            .stats-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (min-width: 1200px) {
            .stats-grid {
                grid-template-columns: repeat(4, minmax(0, 1fr));
            }
        }

        .section-label {
            display: inline-flex;
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 4px 10px;
            border-radius: 999px;
            background: #eafed9;
            color: #0f5f2b;
            margin-bottom: 1rem;
        }

        .quick-card {
            border-radius: 12px;
            border: 1px solid #dce4ea;
            background: #ffffff;
            padding: 1rem;
            transition: border-color 0.2s, box-shadow 0.2s;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            text-decoration: none;
            height: 100%;
        }

        .quick-card:hover {
            border-color: #9ddf4d;
            box-shadow: 0 4px 12px rgba(17, 24, 39, 0.07);
        }

        .icon-box {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        @media (max-width: 767px) {
            .dashboard-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .header-logo {
                width: 100%;
                max-width: 220px;
            }
        }
    `],
    template: `
        <div class="dashboard-shell">
            <div class="dashboard-header">
                <div>
                    <h1 class="header-title">EncuestAR</h1>
                    <p class="header-subtitle">Accede rapidamente a los modulos principales del sistema.</p>
                </div>
                <div class="header-logo">
                    <img src="/images/logo.jpeg" alt="Logo institucional" />
                </div>
            </div>

            <div class="section-card">
                <div class="flex align-items-center justify-content-between gap-3 flex-wrap">
                    <span class="section-label" style="margin-bottom:0;">Tablero de informacion</span>
                    @if (loadingStats) {
                        <span class="loading-state">Cargando indicadores...</span>
                    }
                </div>

                @if (statsError) {
                    <div class="error-state mt-3">
                        {{ statsError }}
                    </div>
                }

                @if (!loadingStats && !statsError) {
                    <div class="stats-grid mt-3">
                        @for (kpi of kpis; track kpi.label) {
                            <div class="kpi-card">
                                <p class="kpi-label">{{ kpi.label }}</p>
                                <p class="kpi-value">{{ kpi.value }}</p>
                                <p class="kpi-hint">{{ kpi.hint }}</p>
                            </div>
                        }
                    </div>

                    <div class="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3">
                        <div class="section-card" style="padding:.75rem;">
                            <div class="flex align-items-center justify-content-between mb-2">
                                <strong class="text-900" style="font-size:.9rem;">Top Encuestadores</strong>
                                <span class="text-600" style="font-size:.75rem;">Encuestas + Observaciones</span>
                            </div>
                            @if (topEncuestadores.length > 0) {
                                <table class="mini-table">
                                    <thead>
                                        <tr>
                                            <th>Encuestador</th>
                                            <th style="text-align:center;">Encuestas</th>
                                            <th style="text-align:center;">Observaciones</th>
                                            <th style="text-align:center;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (item of topEncuestadores; track item.nombre) {
                                            <tr>
                                                <td>{{ item.nombre }}</td>
                                                <td style="text-align:center;">{{ item.encuestas }}</td>
                                                <td style="text-align:center;">{{ item.observaciones }}</td>
                                                <td style="text-align:center;font-weight:700;">{{ item.total }}</td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            } @else {
                                <div class="empty-state">No hay datos de encuestadores para mostrar.</div>
                            }
                        </div>

                        <div class="section-card" style="padding:.75rem;">
                            <div class="flex align-items-center justify-content-between mb-2">
                                <strong class="text-900" style="font-size:.9rem;">Tendencia Ultimos 7 Dias</strong>
                                <span class="text-600" style="font-size:.75rem;">Actividad diaria</span>
                            </div>
                            @if (actividad7Dias.length > 0) {
                                <div class="chart-shell mb-2">
                                    <p-chart type="line" [data]="chartActividadData" [options]="chartActividadOptions" styleClass="w-full" />
                                </div>
                                <table class="mini-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th style="text-align:center;">Encuestas</th>
                                            <th style="text-align:center;">Observaciones</th>
                                            <th style="text-align:center;">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (item of actividad7Dias; track item.fecha) {
                                            <tr>
                                                <td>{{ item.fecha }}</td>
                                                <td style="text-align:center;">{{ item.encuestas }}</td>
                                                <td style="text-align:center;">{{ item.observaciones }}</td>
                                                <td style="text-align:center;font-weight:700;">{{ item.total }}</td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            } @else {
                                <div class="empty-state">No hay actividad en los ultimos 7 dias.</div>
                            }
                        </div>
                    </div>

                    <div class="section-card mt-3" style="padding:.75rem;">
                        <div class="flex align-items-center justify-content-between mb-2">
                            <strong class="text-900" style="font-size:.9rem;">Distribucion Geografica</strong>
                            <div class="flex align-items-center gap-2">
                                <span class="text-600" style="font-size:.75rem;">Fuente:</span>
                                <div class="source-toggle">
                                    <button type="button" [class.active]="geoFuente === 'encuestas'" (click)="setGeoFuente('encuestas')">Encuestas</button>
                                    <button type="button" [class.active]="geoFuente === 'observaciones'" (click)="setGeoFuente('observaciones')">Observaciones</button>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 xl:grid-cols-3 gap-3">
                            <div class="section-card" style="padding:.7rem;">
                                <div class="flex align-items-center justify-content-between mb-2">
                                    <strong class="text-900" style="font-size:.86rem;">Por Departamento</strong>
                                    <span class="text-600" style="font-size:.72rem;">Top 8</span>
                                </div>
                                @if (geoDepartamentos.length > 0) {
                                    <div class="chart-shell mb-2">
                                        <p-chart type="bar" [data]="chartDepartamentoData" [options]="chartDepartamentoOptions" styleClass="w-full" />
                                    </div>
                                    <table class="mini-table">
                                        <thead>
                                            <tr>
                                                <th>Departamento</th>
                                                <th style="text-align:center;">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (item of geoDepartamentos; track item.nombre) {
                                                <tr>
                                                    <td>{{ item.nombre }}</td>
                                                    <td style="text-align:center;font-weight:700;">{{ item.total }}</td>
                                                </tr>
                                            }
                                        </tbody>
                                    </table>
                                } @else {
                                    <div class="empty-state">Sin datos geograficos por departamento.</div>
                                }
                            </div>

                            <div class="section-card" style="padding:.7rem;">
                                <div class="flex align-items-center justify-content-between mb-2">
                                    <strong class="text-900" style="font-size:.86rem;">Por Municipio</strong>
                                    <span class="text-600" style="font-size:.72rem;">Top 8</span>
                                </div>
                                @if (geoMunicipios.length > 0) {
                                    <div class="chart-shell mb-2">
                                        <p-chart type="bar" [data]="chartMunicipioData" [options]="chartMunicipioOptions" styleClass="w-full" />
                                    </div>
                                    <table class="mini-table">
                                        <thead>
                                            <tr>
                                                <th>Municipio</th>
                                                <th style="text-align:center;">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (item of geoMunicipios; track item.nombre) {
                                                <tr>
                                                    <td>{{ item.nombre }}</td>
                                                    <td style="text-align:center;font-weight:700;">{{ item.total }}</td>
                                                </tr>
                                            }
                                        </tbody>
                                    </table>
                                } @else {
                                    <div class="empty-state">Sin datos geograficos por municipio.</div>
                                }
                            </div>

                            <div class="section-card" style="padding:.7rem;">
                                <div class="flex align-items-center justify-content-between mb-2">
                                    <strong class="text-900" style="font-size:.86rem;">Por Centro Poblado</strong>
                                    <span class="text-600" style="font-size:.72rem;">Top 8</span>
                                </div>
                                @if (geoCentrosPoblados.length > 0) {
                                    <div class="chart-shell mb-2">
                                        <p-chart type="bar" [data]="chartCentroData" [options]="chartCentroOptions" styleClass="w-full" />
                                    </div>
                                    <table class="mini-table">
                                        <thead>
                                            <tr>
                                                <th>Centro Poblado</th>
                                                <th style="text-align:center;">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (item of geoCentrosPoblados; track item.nombre) {
                                                <tr>
                                                    <td>{{ item.nombre }}</td>
                                                    <td style="text-align:center;font-weight:700;">{{ item.total }}</td>
                                                </tr>
                                            }
                                        </tbody>
                                    </table>
                                } @else {
                                    <div class="empty-state">Sin datos geograficos por centro poblado.</div>
                                }
                            </div>
                        </div>
                    </div>
                }
            </div>

            <div class="section-card mt-3">
                <span class="section-label">Modulos principales</span>

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    @for (item of managementLinks; track item.route) {
                        <a [routerLink]="item.route" class="quick-card">
                            <div class="flex align-items-center gap-3">
                                <div class="icon-box" [style.background]="item.bg">
                                    <i [class]="item.icon" [style.color]="item.color"></i>
                                </div>
                                <strong class="text-900" style="font-size:.95rem;">{{ item.title }}</strong>
                            </div>
                            <p class="m-0 text-600" style="font-size:.82rem;line-height:1.45;">{{ item.description }}</p>
                        </a>
                    }
                </div>
            </div>
        </div>
    `
})
export class Dashboard implements OnInit {
    managementLinks: QuickAccess[] = [];
    loadingStats = false;
    statsError = '';

    kpis: DashboardKpi[] = [];
    topEncuestadores: TopEncuestador[] = [];
    actividad7Dias: ActividadDia[] = [];
    geoFuente: GeoFuente = 'encuestas';
    geoDepartamentos: GeoDistribucion[] = [];
    geoMunicipios: GeoDistribucion[] = [];
    geoCentrosPoblados: GeoDistribucion[] = [];
    geoEncuestasDepartamentos: GeoDistribucion[] = [];
    geoEncuestasMunicipios: GeoDistribucion[] = [];
    geoEncuestasCentrosPoblados: GeoDistribucion[] = [];
    geoObservacionesDepartamentos: GeoDistribucion[] = [];
    geoObservacionesMunicipios: GeoDistribucion[] = [];
    geoObservacionesCentrosPoblados: GeoDistribucion[] = [];

    chartDepartamentoData: any = { labels: [], datasets: [] };
    chartMunicipioData: any = { labels: [], datasets: [] };
    chartCentroData: any = { labels: [], datasets: [] };
    chartActividadData: any = { labels: [], datasets: [] };

    chartDepartamentoOptions: any = this.createChartOptions();
    chartMunicipioOptions: any = this.createChartOptions();
    chartCentroOptions: any = this.createChartOptions();
    chartActividadOptions: any = this.createTrendChartOptions();

    private readonly allAdminLinks: QuickAccess[] = [
        {
            title: 'Proyectos',
            description: 'Administra los proyectos de levantamiento y su estado general.',
            icon: 'pi pi-briefcase',
            route: '/pages/proyectos',
            color: '#0f5f2b',
            bg: '#d9f8cc'
        },
        {
            title: 'Formularios',
            description: 'Crea, edita y organiza los formularios de captura.',
            icon: 'pi pi-file-edit',
            route: '/pages/formularios',
            color: '#2eaa27',
            bg: '#eafed9'
        },
        {
            title: 'Hogares',
            description: 'Consulta y gestiona los hogares vinculados al proyecto.',
            icon: 'pi pi-home',
            route: '/pages/hogares',
            color: '#5f6972',
            bg: '#e6ecef'
        },
        {
            title: 'Encuestas',
            description: 'Registra y da seguimiento a las encuestas aplicadas.',
            icon: 'pi pi-list-check',
            route: '/pages/encuestas',
            color: '#72d31f',
            bg: '#f0fddf'
        }
    ];

    constructor(
        private authService: AuthService,
        private encuestaService: EncuestaService,
        private hogarService: HogarService,
        private observacionService: ObservacionService
    ) {}

    ngOnInit(): void {
        // Los roles restringidos no deben llegar aquí (roleGuard los redirige),
        // pero como segunda capa, el dashboard no muestra opciones admin.
        if (this.authService.isRolRestringido()) {
            this.managementLinks = [];
        } else {
            this.managementLinks = this.allAdminLinks;
        }

        void this.loadDashboardStats();
    }

    private async loadDashboardStats(): Promise<void> {
        this.loadingStats = true;
        this.statsError = '';

        try {
            const [encuestas, observaciones, hogares] = await Promise.all([
                firstValueFrom(this.encuestaService.getEncuestas()),
                firstValueFrom(this.observacionService.getAll()),
                firstValueFrom(this.hogarService.getAll())
            ]);

            this.buildKpis(encuestas, observaciones);
            this.buildTopEncuestadores(encuestas, observaciones);
            this.buildActividad7Dias(encuestas, observaciones);
            this.buildDistribucionGeografica(encuestas, observaciones, hogares);
        } catch {
            this.statsError = 'No fue posible cargar el tablero de informacion en este momento.';
        } finally {
            this.loadingStats = false;
        }
    }

    private buildKpis(encuestas: Encuesta[], observaciones: Observacion[]): void {
        const totalEncuestas = encuestas.length;
        const totalObservaciones = observaciones.length;
        const totalActividades = totalEncuestas + totalObservaciones;

        const cobertura = totalEncuestas > 0 ? `${((totalObservaciones / totalEncuestas) * 100).toFixed(1)}%` : '0.0%';
        const promedio = totalEncuestas > 0 ? (totalObservaciones / totalEncuestas).toFixed(2) : '0.00';

        this.kpis = [
            { label: 'Total Encuestas', value: String(totalEncuestas), hint: 'Registros de encuestas cargados' },
            { label: 'Total Observaciones', value: String(totalObservaciones), hint: 'Registros de observaciones cargados' },
            { label: 'Total Actividades', value: String(totalActividades), hint: 'Suma de encuestas y observaciones' },
            { label: 'Cobertura Obs/Enc', value: cobertura, hint: `Promedio obs por encuesta: ${promedio}` }
        ];
    }

    private buildTopEncuestadores(encuestas: Encuesta[], observaciones: Observacion[]): void {
        const mapa = new Map<number, TopEncuestador>();

        for (const e of encuestas) {
            if (!e.encuestador_id) continue;
            if (!mapa.has(e.encuestador_id)) {
                mapa.set(e.encuestador_id, {
                    nombre: this.getNombreEncuestadorEncuesta(e),
                    encuestas: 0,
                    observaciones: 0,
                    total: 0
                });
            }
            const item = mapa.get(e.encuestador_id)!;
            item.encuestas++;
            item.total = item.encuestas + item.observaciones;
        }

        for (const o of observaciones) {
            if (!o.encuestador_id) continue;
            if (!mapa.has(o.encuestador_id)) {
                mapa.set(o.encuestador_id, {
                    nombre: this.getNombreEncuestadorObservacion(o),
                    encuestas: 0,
                    observaciones: 0,
                    total: 0
                });
            }
            const item = mapa.get(o.encuestador_id)!;
            item.observaciones++;
            item.total = item.encuestas + item.observaciones;
        }

        this.topEncuestadores = Array.from(mapa.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }

    private buildActividad7Dias(encuestas: Encuesta[], observaciones: Observacion[]): void {
        const mapa = new Map<string, ActividadDia>();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const d = new Date(hoy);
            d.setDate(hoy.getDate() - i);
            const key = this.dateKey(d);
            mapa.set(key, {
                fecha: key,
                encuestas: 0,
                observaciones: 0,
                total: 0
            });
        }

        for (const e of encuestas) {
            const key = this.extractDateKey(e.created_at);
            if (!key || !mapa.has(key)) continue;
            const item = mapa.get(key)!;
            item.encuestas++;
            item.total = item.encuestas + item.observaciones;
        }

        for (const o of observaciones) {
            const key = this.extractDateKey(o.created_at);
            if (!key || !mapa.has(key)) continue;
            const item = mapa.get(key)!;
            item.observaciones++;
            item.total = item.encuestas + item.observaciones;
        }

        this.actividad7Dias = Array.from(mapa.values());
        this.chartActividadData = {
            labels: this.actividad7Dias.map((i) => i.fecha),
            datasets: [
                {
                    type: 'bar',
                    label: 'Encuestas',
                    data: this.actividad7Dias.map((i) => i.encuestas),
                    backgroundColor: 'rgba(37, 99, 235, 0.45)',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    type: 'bar',
                    label: 'Observaciones',
                    data: this.actividad7Dias.map((i) => i.observaciones),
                    backgroundColor: 'rgba(124, 199, 74, 0.45)',
                    borderColor: '#7cc74a',
                    borderWidth: 1,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: 'Total',
                    data: this.actividad7Dias.map((i) => i.total),
                    borderColor: '#f97316',
                    backgroundColor: '#f97316',
                    pointRadius: 3,
                    pointHoverRadius: 4,
                    tension: 0.3,
                    yAxisID: 'y'
                }
            ]
        };
    }

    private buildDistribucionGeografica(encuestas: Encuesta[], observaciones: Observacion[], hogares: Hogar[]): void {
        const hogarLookup = new Map<number, Hogar>();
        for (const hogar of hogares) {
            if (!hogar.id) continue;
            hogarLookup.set(hogar.id, hogar);
        }

        const depMapEncuestas = new Map<string, number>();
        const munMapEncuestas = new Map<string, number>();
        const centroMapEncuestas = new Map<string, number>();

        for (const e of encuestas) {
            const hogarId = e.hogar_id ? Number(e.hogar_id) : null;
            const hogar = hogarId ? hogarLookup.get(hogarId) : null;

            const dep = hogar?.departamento?.nombre?.trim() || (hogar?.departamento_id ? `DEP ID ${hogar.departamento_id}` : 'Sin departamento');
            const mun = hogar?.municipio?.nombre?.trim() || (hogar?.municipio_id ? `MUN ID ${hogar.municipio_id}` : 'Sin municipio');
            const centro = hogar?.centro_poblado?.nombre?.trim() || (hogar?.centro_poblado_id ? `CP ID ${hogar.centro_poblado_id}` : 'Sin centro poblado');

            depMapEncuestas.set(dep, (depMapEncuestas.get(dep) || 0) + 1);
            munMapEncuestas.set(mun, (munMapEncuestas.get(mun) || 0) + 1);
            centroMapEncuestas.set(centro, (centroMapEncuestas.get(centro) || 0) + 1);
        }

        const depMap = new Map<string, number>();
        const munMap = new Map<string, number>();
        const centroMap = new Map<string, number>();

        for (const o of observaciones) {
            const dep = o.departamento?.nombre?.trim() || (o.departamento_id ? `DEP ID ${o.departamento_id}` : 'Sin departamento');
            const mun = o.municipio?.nombre?.trim() || (o.municipio_id ? `MUN ID ${o.municipio_id}` : 'Sin municipio');
            const centro = o.centro_poblado?.nombre?.trim() || (o.centro_poblado_id ? `CP ID ${o.centro_poblado_id}` : 'Sin centro poblado');

            depMap.set(dep, (depMap.get(dep) || 0) + 1);
            munMap.set(mun, (munMap.get(mun) || 0) + 1);
            centroMap.set(centro, (centroMap.get(centro) || 0) + 1);
        }

        this.geoEncuestasDepartamentos = this.mapToDistribucion(depMapEncuestas);
        this.geoEncuestasMunicipios = this.mapToDistribucion(munMapEncuestas);
        this.geoEncuestasCentrosPoblados = this.mapToDistribucion(centroMapEncuestas);

        this.geoObservacionesDepartamentos = this.mapToDistribucion(depMap);
        this.geoObservacionesMunicipios = this.mapToDistribucion(munMap);
        this.geoObservacionesCentrosPoblados = this.mapToDistribucion(centroMap);

        this.setGeoFuente('encuestas');
    }

    setGeoFuente(fuente: GeoFuente): void {
        this.geoFuente = fuente;
        const isEncuestas = fuente == 'encuestas';

        this.geoDepartamentos = isEncuestas ? this.geoEncuestasDepartamentos : this.geoObservacionesDepartamentos;
        this.geoMunicipios = isEncuestas ? this.geoEncuestasMunicipios : this.geoObservacionesMunicipios;
        this.geoCentrosPoblados = isEncuestas ? this.geoEncuestasCentrosPoblados : this.geoObservacionesCentrosPoblados;

        this.chartDepartamentoData = this.createChartData(this.geoDepartamentos, isEncuestas ? '#0ea5a1' : '#7cc74a');
        this.chartMunicipioData = this.createChartData(this.geoMunicipios, isEncuestas ? '#2563eb' : '#2fa3db');
        this.chartCentroData = this.createChartData(this.geoCentrosPoblados, isEncuestas ? '#f97316' : '#f59e0b');
    }

    private mapToDistribucion(mapa: Map<string, number>): GeoDistribucion[] {
        return Array.from(mapa.entries())
            .map(([nombre, total]) => ({ nombre, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
    }

    private createChartData(items: GeoDistribucion[], color: string): any {
        return {
            labels: items.map((i) => i.nombre),
            datasets: [
                {
                    label: 'Total',
                    data: items.map((i) => i.total),
                    backgroundColor: color,
                    borderRadius: 6,
                    maxBarThickness: 26
                }
            ]
        };
    }

    private createChartOptions(): any {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#4b5563'
                    },
                    grid: {
                        color: '#eef3f7'
                    }
                },
                y: {
                    ticks: {
                        color: '#4b5563',
                        autoSkip: false
                    },
                    grid: {
                        display: false
                    }
                }
            },
            indexAxis: 'y'
        };
    }

    private createTrendChartOptions(): any {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#4b5563'
                    },
                    grid: {
                        color: '#eef3f7'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: '#4b5563'
                    },
                    grid: {
                        color: '#eef3f7'
                    }
                }
            }
        };
    }

    private getNombreEncuestadorEncuesta(encuesta: Encuesta): string {
        const rel = encuesta.encuestador ?? encuesta.usuario ?? null;
        if (!rel) return encuesta.encuestador_id ? `ID ${encuesta.encuestador_id}` : 'Sin encuestador';
        const nombre = `${rel.nombres || rel.nombre || ''} ${rel.apellidos || rel.apellido || ''}`.trim();
        return nombre || (encuesta.encuestador_id ? `ID ${encuesta.encuestador_id}` : 'Sin encuestador');
    }

    private getNombreEncuestadorObservacion(observacion: Observacion): string {
        const rel = observacion.encuestador;
        if (!rel) return observacion.encuestador_id ? `ID ${observacion.encuestador_id}` : 'Sin encuestador';
        const nombre = `${rel.nombres || ''} ${rel.apellidos || ''}`.trim();
        return nombre || (observacion.encuestador_id ? `ID ${observacion.encuestador_id}` : 'Sin encuestador');
    }

    private extractDateKey(raw?: string | null): string | null {
        if (!raw) return null;
        return raw.substring(0, 10);
    }

    private dateKey(d: Date): string {
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
}
