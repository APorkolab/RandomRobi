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
            sanitize: (ctx: unknown, val: unknown) => val,
            bypassSecurityTrustHtml: (val: unknown) => val,
            bypassSecurityTrustStyle: (val: unknown) => val,
            bypassSecurityTrustScript: (val: unknown) => val,
            bypassSecurityTrustUrl: (val: unknown) => val,
            bypassSecurityTrustResourceUrl: (val: unknown) => val,
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
