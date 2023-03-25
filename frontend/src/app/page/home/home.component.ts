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

  entity: string = 'Video';

  constructor(
    private videoService: VideoService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.video$.pipe(map(video => video.link)).subscribe(link => this.link = link);
  }
}
