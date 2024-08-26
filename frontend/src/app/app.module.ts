import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './page/home/home.component';
import { SafePipe } from './pipe/safe.pipe';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { AdminComponent } from './page/admin/admin.component';
import { VideoEditorComponent } from './page/video-editor/video-editor.component';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './page/login/login.component';
import { SorterPipe } from './pipe/sorter.pipe';
import { FilterPipe } from './pipe/filter.pipe';
import { JwtInterceptor } from './service/jwt.interceptor';
import { AuthService } from './service/auth.service';
import { UserComponent } from './page/user/user.component';
import { UserEditorComponent } from './page/user-editor/user-editor.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { VideoService } from './service/video.service';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SafePipe,
    SidebarComponent,
    VideoEditorComponent,
    LoginComponent,
    SorterPipe,
    FilterPipe,
    UserComponent,
    UserEditorComponent,
    AdminComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatIconModule,
    BrowserAnimationsModule,
    CommonModule,
    RouterModule.forRoot([])
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      deps: [AuthService],
      multi: true,
    },
    DatePipe,
    VideoService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }