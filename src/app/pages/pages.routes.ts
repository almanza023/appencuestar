import { Routes } from '@angular/router';
import { Proyectos } from './proyectos/proyectos';
import { Formularios } from './formularios/formularios';
import { FormularioBuilder } from './formularios/formulario-builder';
import { FormularioResponder } from './formularios/formulario-responder';
import { Departamentos } from './departamentos/departamentos';
import { Municipios } from './municipios/municipios';
import { CentrosPoblados } from './centros-poblados/centros-poblados';
import { Roles } from './roles/roles';
import { Estados } from './estados/estados';
import { Usuarios } from './usuarios/usuarios';
import { MiPerfil } from './mi-perfil/mi-perfil';
import { Hogares } from './hogares/hogares';
import { Catalogos } from './catalogos/catalogos';
import { Encuestas } from './encuestas/encuestas';
import { AutorizacionesDatos } from './autorizaciones-datos/autorizaciones-datos';
import { roleGuard } from '@/app/core/guards/auth.guard';

export default [
    { path: 'proyectos',            component: Proyectos,          canActivate: [roleGuard] },
    { path: 'formularios',          component: Formularios,         canActivate: [roleGuard] },
    { path: 'formularios/nuevo',    component: FormularioBuilder,   canActivate: [roleGuard] },
    { path: 'formularios/:id/editar', component: FormularioBuilder, canActivate: [roleGuard] },
    { path: 'formularios/:id/responder', component: FormularioResponder },
    { path: 'departamentos',        component: Departamentos,       canActivate: [roleGuard] },
    { path: 'municipios',           component: Municipios,          canActivate: [roleGuard] },
    { path: 'centros-poblados',     component: CentrosPoblados,     canActivate: [roleGuard] },
    { path: 'roles',                component: Roles,               canActivate: [roleGuard] },
    { path: 'estados',              component: Estados,             canActivate: [roleGuard] },
    { path: 'usuarios',             component: Usuarios,            canActivate: [roleGuard] },
    { path: 'hogares',              component: Hogares,             canActivate: [roleGuard] },
    { path: 'encuestas',            component: Encuestas },
    { path: 'catalogos',            component: Catalogos,           canActivate: [roleGuard] },
    { path: 'autorizaciones-datos', component: AutorizacionesDatos, canActivate: [roleGuard] },
    { path: 'mi-perfil',            component: MiPerfil },
    { path: '**', redirectTo: '/404' }
] as Routes;
