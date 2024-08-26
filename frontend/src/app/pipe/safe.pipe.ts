import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) { }

  transform(value: string, type: 'url' | 'html' = 'url'): SafeUrl | SafeHtml {
    switch (type) {
      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(value);
      case 'url':
      default:
        return this.sanitizer.bypassSecurityTrustUrl(value);
    }
  }
}