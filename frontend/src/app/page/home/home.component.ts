import { Component, OnInit } from '@angular/core';
import { VideoService } from '../../service/video.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  link!: SafeResourceUrl;
  showAdminButton: boolean = false;
  currentYear: number = new Date().getFullYear();

  constructor(private videoService: VideoService, private sanitizer: DomSanitizer, private router: Router) { }

  ngOnInit(): void {
    this.getRandomVideo();
    this.delayAdminButton();
  }

  getRandomVideo() {
    this.videoService.getRandomVideo().subscribe(
      (response: any) => {
        // Ellenőrizzük, hogy a válasz tartalmazza-e a link tulajdonságot
        if (response && response.link) {
          console.log('Kapott video URL:', response.link);
          // Biztonságosan megjelenítjük az URL-t az iframe-ben
          this.link = this.sanitizer.bypassSecurityTrustResourceUrl(response.link);
        } else {
          console.error('Érvénytelen videó URL:', response ? response.link : 'undefined');
        }
      },
      (error) => {
        console.error('Hiba történt a videó betöltése közben:', error);
      }
    );
  }

  onAdminClick(): void {
    this.router.navigate(['/admin']);
  }

  delayAdminButton(): void {
    setTimeout(() => {
      this.showAdminButton = true;
    }, 10000);  // 10 másodperc késleltetés (10000 ms)
  }
}