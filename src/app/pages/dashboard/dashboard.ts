import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@/app/core/services/auth.service';

type QuickAccess = {
    title: string;
    description: string;
    icon: string;
    route: string;
    color: string;
    bg: string;
};

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [RouterLink],
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

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        // Los roles restringidos no deben llegar aquí (roleGuard los redirige),
        // pero como segunda capa, el dashboard no muestra opciones admin.
        if (this.authService.isRolRestringido()) {
            this.managementLinks = [];
        } else {
            this.managementLinks = this.allAdminLinks;
        }
    }
}
