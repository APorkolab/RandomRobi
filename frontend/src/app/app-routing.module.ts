import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './page/home/home.component';
import { LoginComponent } from './page/login/login.component';
import { AdminComponent } from './page/admin/admin.component';
import { VideoEditorComponent } from './page/video-editor/video-editor.component';
import { UserComponent } from './page/user/user.component';
import { UserEditorComponent } from './page/user-editor/user-editor.component';
import { AuthGuardService } from './service/auth-guard.service';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuardService] },
  { path: 'edit/0', component: VideoEditorComponent, canActivate: [AuthGuardService] },
  { path: 'edit/:id', component: VideoEditorComponent, canActivate: [AuthGuardService] },
  { path: 'users', component: UserComponent, canActivate: [AuthGuardService] },
  { path: 'users/edit/0', component: UserEditorComponent, canActivate: [AuthGuardService] },
  { path: 'user/edit/:id', component: UserEditorComponent, canActivate: [AuthGuardService] },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }