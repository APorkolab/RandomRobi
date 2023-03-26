import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './page/home/home.component';
import { SafePipe } from './safe.pipe';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { AdminComponent } from './page/admin/admin.component';
import { VideoEditorComponent } from './page/video-editor/video-editor.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SafePipe,
    SidebarComponent,
    AdminComponent,
    VideoEditorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
