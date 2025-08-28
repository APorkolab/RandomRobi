import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafePipe } from './safe.pipe';

describe('SafePipe', () => {
  let pipe: SafePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SafePipe,
        {
          provide: DomSanitizer,
          useValue: {
            sanitize: (ctx: any, val: any) => val,
            bypassSecurityTrustHtml: (val: any) => val,
            bypassSecurityTrustStyle: (val: any) => val,
            bypassSecurityTrustScript: (val: any) => val,
            bypassSecurityTrustUrl: (val: any) => val,
            bypassSecurityTrustResourceUrl: (val: any) => val,
          },
        },
      ],
    });
    pipe = TestBed.inject(SafePipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
});
