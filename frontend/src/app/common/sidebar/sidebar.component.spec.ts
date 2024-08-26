import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with sidebar open', () => {
    localStorage.setItem('sidebarState', 'open');
    component.ngOnInit();
    expect(component.isSidebarOpen).toBeTrue();
  });

  it('should toggle sidebar state', () => {
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBeFalse();
  });

  it('should save sidebar state to localStorage', () => {
    component.saveSidebarState();
    expect(localStorage.getItem('sidebarState')).toBe('open');
  });
});
