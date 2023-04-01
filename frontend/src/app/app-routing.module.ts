import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './page/admin/admin.component';
import { HomeComponent } from './page/home/home.component';
import { LoginComponent } from './page/login/login.component';
import { VideoEditorComponent } from './page/video-editor/video-editor.component';
import { AuthGuardService } from './service/auth-guard.service';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '*',
    component: LoginComponent,
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'edit/`0`',
    component: VideoEditorComponent,
    canActivate: [AuthGuardService],
  },
  {
    path: 'edit/:id',
    component: VideoEditorComponent,
    canActivate: [AuthGuardService],
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
