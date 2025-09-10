import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    standalone: false
})
export class SidebarComponent implements OnInit {
  isSidebarOpen = true;

  ngOnInit(): void {
    this.checkInitialSidebarState();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private checkInitialSidebarState(): void {
    const sidebarState = localStorage.getItem('sidebarState');
    this.isSidebarOpen = sidebarState === 'open';
  }

  saveSidebarState(): void {
    const state = this.isSidebarOpen ? 'open' : 'closed';
    localStorage.setItem('sidebarState', state);
  }
}
