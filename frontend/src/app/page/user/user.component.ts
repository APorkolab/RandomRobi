import { UserService } from './../../service/user.service';
import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from 'src/app/model/user';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  @Input() list: User[] | any[] = [];
  users$!: Observable<User[]>;
  user: User = new User();
  user$ = this.auth.user$;

  keys: { [x: string]: string } = {};
  phrase: string = '';
  filterKey: string = '';
  changeText = true;
  pageSize: number = 25;
  lastPage = false;
  startSlice: number = 0;
  endSlice: number = 25;
  page: number = 1;

  columns = [
    { key: 'id', title: 'ID' },
    { key: 'username', title: 'Username' },
    { key: 'password', title: 'Password' },
    { key: 'email', title: 'E-mail' },
  ];

  constructor(private userService: UserService, private router: Router, private auth: AuthService) { }

  ngOnInit(): void {
    this.users$ = this.userService.getAll();
    this.users$.subscribe((users) => {
      this.list = users;
      this.updatePage();
    });
  }
  get pageList(): number[] {
    const pageCount = Math.ceil(this.list.length / this.pageSize);
    const maxPageCount = Math.min(pageCount, 10);
    const pages = new Array(maxPageCount).fill(1).map((x, i) => i + 1);
    return pages;
  }

  columnKey: string = '';
  sortDir: number = -1;

  onColumnSelect(key: string): void {
    this.columnKey = key;
    this.sortDir = this.sortDir * -1;
  }

  jumptoPage(pageNum: number): void {
    const maxPage = Math.ceil(this.list.length / this.pageSize);
    if (pageNum < 1 || pageNum > maxPage) {
      return;
    }
    this.page = pageNum;
    this.updatePage();
  }

  private updatePage(): void {
    const maxPage = Math.ceil(this.list.length / this.pageSize);
    this.startSlice = (this.page - 1) * this.pageSize;
    this.endSlice = Math.min(this.startSlice + this.pageSize, this.list.length);
    const pageList = new Array(maxPage).fill(1).map((x, i) => i + 1);
    this.lastPage = this.page === pageList[pageList.length - 1];
  }

  editUser(user: User): void {
    this.router.navigate(['/', 'user', 'edit', user.id]);
  }

  deleteUser(user: User): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.delete(user).subscribe({
        next: () => {
          this.users$ = this.userService.getAll();
          console.log('Video deleted successfully.');
        },
        error: (err) => console.error(err),
        complete: () => alert('The video has been deleted successfully.'),
      });
    }
  }

  onCreate(user: User) {
    this.userService.create(user).subscribe({
      next: () => this.router.navigate(['/user', 'edit', 0]),
      error: (err) => console.log(err),
      complete: () => alert('The new video has been created successfully.'),
    });
  }

}