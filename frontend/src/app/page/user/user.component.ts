import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { User } from 'src/app/model/user';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  user$!: Observable<User>;
  users$!: Observable<User[]>;
  pageList: number[] = [];
  page = 1;
  startSlice = 0;
  endSlice = 10;
  phrase = '';
  filterKey = '';
  columnKey = '';
  sortDir: boolean = true;
  columns = [
    { key: 'id', title: 'ID' },
    { key: 'username', title: 'Username' },
    { key: 'email', title: 'Email' }
  ];

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {
    this.loadUsers();
    this.setupPagination();
  }

  setupPagination(): void {
    this.users$.subscribe(users => {
      const totalItems = users.length;
      const itemsPerPage = 10;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      this.pageList = Array.from({ length: totalPages }, (_, i) => i + 1);

      if (this.page > totalPages) {
        this.page = totalPages;
        this.jumptoPage(this.page);
      }
    });
  }

  loadUsers(): void {
    this.users$ = this.userService.getAllUsers();
  }

  editUser(user: User): void {
    this.router.navigate(['/user/edit', user.id]);
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete the user with ID ${user.id}?`)) {
      this.userService.handleUser('delete', user).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  jumptoPage(pageNum: number): void {
    this.page = pageNum;
    this.startSlice = (pageNum - 1) * 10;
    this.endSlice = this.startSlice + 10;
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