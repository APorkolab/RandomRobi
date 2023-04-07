import { Component, Input, OnInit } from '@angular/core';
import { VideoService } from '../../service/video.service';
import { Video } from '../../model/video';
import { AuthService } from 'src/app/service/auth.service';

import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  @Input() list: Video[] | any[] = [];
  user$ = this.auth.user$;

  videos$!: Observable<Video[]>;
  video: Video = new Video();


  keys: { [x: string]: string } = {};
  phrase: string = '';
  filterKey: string = '';
  changeText = true;
  pageSize: number = 25;

  startSlice: number = 0;
  endSlice: number = 25;
  page: number = 1;

  columns = [
    { key: 'id', title: 'ID' },
    { key: 'link', title: 'Link' },
    { key: 'createdAt', title: 'Created At' }
  ];
  get pageList(): number[] {
    const pageSize = Math.ceil(this.list.length / this.pageSize);
    return new Array(pageSize).fill(1).map((x, i) => i + 1);
  }

  columnKey: string = '';
  sortDir: number = -1;

  onColumnSelect(key: string): void {
    this.columnKey = key;
    this.sortDir = this.sortDir * -1;
  }
  constructor(private videoService: VideoService, private router: Router, private auth: AuthService) { }

  ngOnInit(): void {
    this.videos$ = this.videoService.getAll();
  }

  editVideo(video: Video): void {
    this.router.navigate(['/', 'edit', video.id]);
  }

  deleteVideo(video: Video): void {
    if (confirm('Are you sure you want to delete this video?')) {
      this.videoService.delete(video).subscribe({
        next: () => {
          this.videos$ = this.videoService.getAll();
          console.log('Video deleted successfully.');
        },
        error: (err) => console.error(err),
        complete: () => alert('The video has been deleted successfully.'),
      });
    }
  }

  jumptoPage(pageNum: number): void {
    this.page = pageNum;
    this.startSlice = this.pageSize * (pageNum - 1);
    this.endSlice = this.startSlice + this.pageSize;
  }

  onCreate(video: Video) {
    this.videoService.create(video).subscribe({
      next: () => this.router.navigate(['/', 'admin']),
      error: (err) => console.log(err),
      complete: () => alert('The new video has been created successfully.'),
    });
  }
}
