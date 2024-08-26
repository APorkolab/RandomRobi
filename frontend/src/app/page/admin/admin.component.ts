import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VideoService } from '../../service/video.service';
import { Router } from '@angular/router';
import { User } from 'src/app/model/user';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  user$!: Observable<User>;
  isUserLoggedIn$: Observable<boolean> = new Observable<boolean>();
  videos$: Observable<any[]> = new Observable<any[]>();
  pageList: number[] = [];
  page = 1;
  startSlice = 0;
  endSlice = 10;
  phrase = '';
  filterKey = '';
  columnKey = '';
  sortDir = true;
  columns = [
    { key: 'id', title: 'ID' },
    { key: 'link', title: 'Link' },
    { key: 'createdAt', title: 'Created At' }
  ];

  constructor(private videoService: VideoService, private router: Router) { }

  ngOnInit(): void {
    this.isUserLoggedIn$ = this.user$.pipe(map(user => !!user));
    this.loadVideos();
    this.setupPagination();
  }

  loadVideos(): void {
    this.videos$ = this.videoService.getAllVideos();  // Helyes metódusnév
  }

  editVideo(video: any): void {
    this.router.navigate(['/edit', video.id]);
  }

  deleteVideo(video: any): void {
    if (confirm(`Are you sure you want to delete the video with ID ${video.id}?`)) {
      this.videoService.deleteVideo(video.id).subscribe(() => {
        this.loadVideos(); // Reload videos after deletion
      });
    }
  }

  jumptoPage(pageNum: number): void {
    this.page = pageNum;
    this.startSlice = (pageNum - 1) * 10;
    this.endSlice = this.startSlice + 10;
  }

  setupPagination(): void {
    this.videos$.subscribe(videos => {
      const pages = Math.ceil(videos.length / 10);
      this.pageList = Array.from({ length: pages }, (_, i) => i + 1);
    });
  }

  onColumnSelect(columnKey: string): void {
    if (this.columnKey === columnKey) {
      this.sortDir = !this.sortDir;
    } else {
      this.columnKey = columnKey;
      this.sortDir = true;
    }
  }
}