import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './page/admin/admin.component';
import { HomeComponent } from './page/home/home.component';
import { VideoEditorComponent } from './page/video-editor/video-editor.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'admin',
    component: AdminComponent,
  },
  {
    path: 'edit/`0`',
    component: VideoEditorComponent,
    // canActivate: [AuthGuardService, RoleGuardService],
    // data: {
    //   expectedRole: 3,
    // },
  },
  {
    path: 'edit/:id',
    component: VideoEditorComponent,
    // canActivate: [AuthGuardService, RoleGuardService],
    // data: {
    //   expectedRole: 2,
    // },
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
