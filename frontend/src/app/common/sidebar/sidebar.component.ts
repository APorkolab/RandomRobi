import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isSidebarOpen: boolean = true;

  constructor() { }

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
