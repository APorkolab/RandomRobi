import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../service/user.service';
import { User } from 'src/app/model/user';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-user-editor',
  templateUrl: './user-editor.component.html',
  styleUrls: ['./user-editor.component.scss']
})
export class UserEditorComponent implements OnInit {
  user$!: Observable<User>;
  user: User = new User();

  constructor(private userService: UserService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.userService.getUserById(+userId).subscribe(user => {
        this.user = user;
      });
    }
  }

  onSave(): void {
    if (this.user.id) {
      this.onUpdate();
    } else {
      this.onCreate();
    }
  }

  onUpdate(): void {
    this.userService.handleUser('update', this.user).subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err) => console.error('Error updating user:', err)
    });
  }

  onCreate(): void {
    this.userService.handleUser('create', this.user).subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err) => console.error('Error creating user:', err)
    });
  }
}