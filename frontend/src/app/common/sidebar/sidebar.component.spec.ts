import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let getItemSpy: jasmine.Spy;
  let setItemSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;

    // Spy on localStorage before each test
    getItemSpy = spyOn(localStorage, 'getItem').and.callThrough();
    setItemSpy = spyOn(localStorage, 'setItem').and.callThrough();
  });

  it('should create the sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with sidebar open if localStorage is "open"', () => {
    getItemSpy.and.returnValue('open');
    component.ngOnInit(); // Manually call ngOnInit to control lifecycle
    expect(component.isSidebarOpen).toBe(true);
  });

  it('should initialize with sidebar closed if localStorage is not "open"', () => {
    getItemSpy.and.returnValue('closed');
    component.ngOnInit();
    expect(component.isSidebarOpen).toBe(false);
  });

  it('should toggle sidebar state from open to closed', () => {
    component.isSidebarOpen = true; // Set initial state
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBe(false);
  });

  it('should toggle sidebar state from closed to open', () => {
    component.isSidebarOpen = false; // Set initial state
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBe(true);
  });

  it('should save "open" to localStorage', () => {
    component.isSidebarOpen = true;
    component.saveSidebarState();
    expect(setItemSpy).toHaveBeenCalledWith('sidebarState', 'open');
  });

  it('should save "closed" to localStorage', () => {
    component.isSidebarOpen = false;
    component.saveSidebarState();
    expect(setItemSpy).toHaveBeenCalledWith('sidebarState', 'closed');
  });
});
