import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { User } from 'src/app/model/user';
import { VideoService } from 'src/app/service/video.service';
import { Video } from 'src/app/model/video';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit {
  user$!: Observable<User>;
  isUserLoggedIn$: Observable<boolean> = new Observable<boolean>();
  dataSource: MatTableDataSource<Video> = new MatTableDataSource<Video>();
  displayedColumns: string[] = ['id', 'link', 'createdAt', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private videoService: VideoService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.user$ = this.authService.getUser();
    this.isUserLoggedIn$ = this.user$.pipe(map(user => !!user));
    this.loadVideos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadVideos(): void {
    this.videoService.getAllVideos().pipe(
      catchError(error => {
        console.error('Error loading videos:', error);
        return of([]);
      })
    ).subscribe(videos => {
      this.dataSource.data = videos;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  editVideo(video: Video): void {
    this.router.navigate(['/video-editor', video.id]);
  }

  deleteVideo(video: Video): void {
    if (confirm(`Are you sure you want to delete the video with ID ${video.id}?`)) {
      this.videoService.deleteVideo(+video.id).subscribe(() => {
        this.loadVideos();
      });
    }
  }
}