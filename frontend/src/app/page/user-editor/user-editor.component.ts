import { UserService } from './../../service/user.service';
import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/model/user';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-user-editor',
  templateUrl: './user-editor.component.html',
  styleUrls: ['./user-editor.component.scss']
})
export class UserEditorComponent implements OnInit {
  user$!: Observable<User>;
  user: User = new User();

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe({
      next: (param) => {
        if (param['id'] == '0') {
          return of(new User());
        }
        this.user$ = this.userService.getOne(param['id']);
        return this.userService.getOne(param['id']);
      },
    });
    this.user$.subscribe({
      next: (user) =>
        (this.user = user ? user : this.user),
    });
  }

  onUpdate(user: User) {
    this.userService.update(user).subscribe({
      next: (category) => this.router.navigate(['/', 'users']),
      error: (err) => console.error(err),
      complete: () => alert('The user has been updated successfully.'),
    });
  }

  onCreate(user: User) {
    this.userService.create(user).subscribe({
      next: (category) => this.router.navigate(['/', 'users']),
      error: (err) => console.error(err),
      complete: () => alert('The new user has been created successfully.'),
    });
  }

}