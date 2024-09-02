import { Component, OnInit } from '@angular/core';
import { VideoService } from '../../service/video.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  link: string = '';
  showAdminButton: boolean = false;
  isLoading: boolean = false;
  getRandomVideoClick$ = new Subject<void>();  // Subject a debounce-hoz
  currentYear: number = new Date().getFullYear();

  constructor(private videoService: VideoService, private sanitizer: DomSanitizer, private router: Router) { }

  ngOnInit(): void {
    this.getRandomVideoClick$
      .pipe(debounceTime(2000))  // 2 másodperces debounce
      .subscribe(() => this.getRandomVideo());

    this.getRandomVideo();
    this.delayAdminButton();
  }

  getRandomVideo() {
    if (this.isLoading) return;

    this.isLoading = true;

    this.videoService.getRandomVideo().subscribe(
      (response: any) => {
        this.isLoading = false;
        if (response && response.link) {
          console.log('Kapott video URL:', response.link);
          this.link = response.link;
        } else {
          console.error('Érvénytelen videó URL:', response ? response.link : 'undefined');
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Hiba történt a videó betöltése közben:', error);
      }
    );
  }

  triggerRandomVideo(): void {
    this.getRandomVideoClick$.next();
  }

  onAdminClick(): void {
    this.router.navigate(['/admin']);
  }

  delayAdminButton(): void {
    setTimeout(() => {
      this.showAdminButton = true;
    }, 10000);
  }
}