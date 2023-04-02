import { UserService } from './../../service/user.service';
import { Component, OnInit } from '@angular/core';
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
  users$!: Observable<User[]>;
  user: User = new User();
  user$ = this.auth.user$;
  constructor(private userService: UserService, private router: Router, private auth: AuthService) { }

  ngOnInit(): void {
    this.users$ = this.userService.getAll();
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
      next: () => this.router.navigate(['/', 'user']),
      error: (err) => console.log(err),
      complete: () => alert('The new video has been created successfully.'),
    });
  }

  onCreateUser() {
    // A `navigate()` metódus átadja az útvonalat és az opcionális paramétereket
    this.router.navigate(['/user', 'edit', 0]);
  }
}