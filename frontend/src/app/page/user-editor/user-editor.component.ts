import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../service/user.service';
import { User } from 'src/app/model/user';
import { Observable } from 'rxjs';

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
      this.userService.handleUser('get').subscribe((users: User[]) => {  // Típus meghatározása User[]
        this.user = users.find((u: User) => u.id === userId) || this.user;  // Típus meghatározása User
      });
    }
  }

  onSave(): void {
    if (this.user.id) {
      this.userService.handleUser('update', this.user).subscribe(() => {
        this.router.navigate(['/users']);
      });
    } else {
      this.userService.handleUser('create', this.user).subscribe(() => {
        this.router.navigate(['/users']);
      });
    }
  }
}