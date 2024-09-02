import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './page/home/home.component';
import { LoginComponent } from './page/login/login.component';
import { AdminComponent } from './page/admin/admin.component';
import { VideoEditorComponent } from './page/video-editor/video-editor.component';
import { UserComponent } from './page/user/user.component';
import { UserEditorComponent } from './page/user-editor/user-editor.component';
import { SafePipe } from './pipe/safe.pipe';
import { SorterPipe } from './pipe/sorter.pipe';
import { FilterPipe } from './pipe/filter.pipe';
import { JwtInterceptor } from './service/jwt.interceptor';
import { AuthService } from './service/auth.service';
import { VideoService } from './service/video.service';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    AdminComponent,
    VideoEditorComponent,
    UserComponent,
    UserEditorComponent,
    SafePipe,
    SorterPipe,
    FilterPipe,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    MatIconModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    DatePipe,
    VideoService,
    AuthService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }