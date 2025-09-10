import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../service/user.service';
import { User } from 'src/app/model/user';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-user-editor',
    templateUrl: './user-editor.component.html',
    styleUrls: ['./user-editor.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ]
})
export class UserEditorComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  user$!: Observable<User>;
  user: User = new User();
  userForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.user$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id && id !== '0') {
          return this.userService.getUserById(+id);
        } else {
          return of(new User());
        }
      }),
      tap(user => {
        this.user = { ...user };
        this.userForm.patchValue(this.user);
      })
    );

    this.userForm.valueChanges.subscribe((formValues: Partial<User>) => {
      this.user = { ...this.user, ...formValues };
    });
  }

  initForm(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(60)]],
      email: ['', [Validators.email]]
    });
  }

  onSave(): void {
    if (this.userForm.valid) {
      const updatedUser = { ...this.user, ...this.userForm.value };
      if (updatedUser.id) {
        this.onUpdate(updatedUser);
      } else {
        this.onCreate(updatedUser);
      }
    }
  }

  onUpdate(user: User): void {
    this.userService.handleUser('update', user).subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err) => console.error('Error updating user:', err)
    });
  }

  onCreate(user: User): void {
    this.userService.handleUser('create', user).subscribe({
      next: () => {
        this.router.navigate(['/users']);
      },
      error: (err) => console.error('Error creating user:', err)
    });
  }
}