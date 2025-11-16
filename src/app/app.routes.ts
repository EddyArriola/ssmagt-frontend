import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { InicioCiudadanoComponent } from './components/ciudadano/inicio-ciudadano/inicio-ciudadano.component';
import { TarjetasAprovadasComponent } from './components/ciudadano/tarjetas-aprovadas/tarjetas-aprovadas.component';
import { SolicitudTarjetasComponent } from './components/ciudadano/solicitud-tarjetas/solicitud-tarjetas.component';
import { ActualizarDatosComponent } from './components/ciudadano/actualizar-datos/actualizar-datos.component';

import { InicioMedicoComponent } from './components/medico/inicio-medico/inicio-medico.component';
import { SolicitudesComponent } from './components/medico/solicitudes/solicitudes.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { InicioAdminComponent } from './components/admin/inicio-admin/inicio-admin.component';
import { ListadoUsuariosComponent } from './components/admin/listado-usuarios/listado-usuarios.component';
import { ListadoInstitutoComponent } from './components/admin/listado-instituto/listado-instituto.component';
import { InicioConsultorComponent } from './components/consultor/inicio-consultor/inicio-consultor.component';
import { ListadoTarjetasComponent } from './components/consultor/listado-tarjetas/listado-tarjetas.component';

export const routes: Routes = [
	{ path: 'login', component: LoginComponent },
	{ path: 'inicioCiudadano', component: InicioCiudadanoComponent },
	{ path: 'inicio-medico', component: InicioMedicoComponent },
	{ path: 'tarjetasAprobadas', component: TarjetasAprovadasComponent },
	{ path: 'tarjetas-aprobadas-centro', component: TarjetasAprovadasComponent },
	{ path: 'nueva-solicitud', component: SolicitudTarjetasComponent },
	{ path: 'actualizar-datos', component: ActualizarDatosComponent },
	{ path: 'Solicitudes-pendientes', component: SolicitudesComponent },
	{ path: 'register', component: CreateUserComponent },
	{ path: 'inicio-admin', component: InicioAdminComponent },
	{ path: 'admin/usuarios', component: ListadoUsuariosComponent },
	{ path: 'admin/instituto', component: ListadoInstitutoComponent },
	{ path: 'inicio-consultor', component: InicioConsultorComponent },
	{ path: 'consultor/tarjetas', component: ListadoTarjetasComponent },
	{ path: '', redirectTo: 'login', pathMatch: 'full' }
];
