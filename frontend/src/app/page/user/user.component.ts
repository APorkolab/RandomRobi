import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { User } from 'src/app/model/user';
import { AuthService } from 'src/app/service/auth.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        RouterModule
    ]
})
export class UserComponent implements OnInit, AfterViewInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private authService = inject(AuthService);

  isUserLoggedIn$: Observable<boolean> = this.authService.isLoggedIn$;
  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>();
  displayedColumns: string[] = ['id', 'username', 'email', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe(users => {
      this.dataSource.data = users;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  editUser(user: User): void {
    this.router.navigate(['/user/edit', user.id]);
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete the user with ID ${user.id}?`)) {
      this.userService.handleUser('delete', user).subscribe(() => {
        this.loadUsers(); // Reload data after deletion
      });
    }
  }
}