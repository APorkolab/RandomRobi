import { Component, OnInit } from '@angular/core';
import { VideoService } from '../../service/video.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Video } from 'src/app/model/video';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
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

    this.videoService.getRandomVideo().subscribe({
      next: (response: Video) => {
        this.isLoading = false;
        if (response && response.link) {
          console.log('Received video URL:', response.link);
          this.link = response.link;
        } else {
          console.error('Invalid video URL:', response ? response.link : 'undefined');
          this.link = '';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error occurred while loading video:', error);
      }
    });
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