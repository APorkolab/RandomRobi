import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  currentYear: number = new Date().getFullYear();

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20), Validators.pattern('[a-zA-Z0-9]+')]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.authService.login(this.loginForm.value).subscribe(
      (response: {accessToken?: string}) => {
        if (response && response.accessToken) {
          this.authService.saveToken(response.accessToken);
          this.router.navigate(['/admin']);
        } else {
          console.error('Missing token from response');
          // Optionally: display an error message to the user
        }
      },
      (error: unknown) => {
        console.error('Login error:', error);
        // Optionally: display an error message to the user
      }
    );
  }
}