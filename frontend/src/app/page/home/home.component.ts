import { VideoService } from './../../service/video.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Video } from 'src/app/model/video';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  video$: Observable<Video> = this.videoService.getLatest();
  link = '';
  isPlaying = false;
  isLoaded = false;
  showAdminButton = false;
  entity: string = 'Video';

  constructor(
    private videoService: VideoService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.video$.pipe(map(video => video.link)).subscribe(link => this.link = link);
    setTimeout(() => {
      this.showAdminButton = true;
      console.log('Admin button revealed.');
    }, 15000);
  }

  onAdminClick() {
    this.router.navigate(['/', 'admin']);
  }

  getRandomVideo() {
    this.videoService.getRandom().subscribe(video => {
      this.link = video.link.slice(1, -1); // videó link első és utolsó karaktereinek kivágása
      this.isPlaying = false;
    });
  }

  onLoad() {
    console.log('Video loaded.');
    this.isPlaying = true;
    this.isLoaded = true;
  }

  onEnded() {
    console.log('Video ended.');
    this.isPlaying = false;
    this.isLoaded = false;
  }
  onPause() {
    console.log('Video paused');
    this.isPlaying = false;
  }

  onError() {
    console.log('Error loading video.');
    this.isPlaying = false;
    this.isLoaded = false;
  }

  getButtonText(): string {
    return this.isPlaying ? 'Weird sh*t generator disabled' : 'Gimme some weird YT sh*t, dude!';
  }

  getButtonClass(): string {
    return this.isPlaying ? 'btn-outline-dark btn-sm' : 'btn-dark';
  }


}
