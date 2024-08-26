import { Component, OnInit } from '@angular/core';
import { VideoService } from '../../service/video.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  link: string = '';
  showAdminButton: boolean = false;
  currentYear: number = new Date().getFullYear();

  constructor(private videoService: VideoService, private router: Router) { }

  ngOnInit(): void {
    this.getRandomVideo();
    this.delayAdminButton();  // Késleltetett admin gomb megjelenítésének hívása
  }

  getRandomVideo(): void {
    this.videoService.getRandomVideo().subscribe((video: { link: string; }) => {
      this.link = video.link;
    });
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
