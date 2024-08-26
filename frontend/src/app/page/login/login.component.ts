import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginData = {
    username: '',
    password: ''
  };

  constructor(private router: Router) { }
  currentYear: number = new Date().getFullYear();
  onLogin(): void {
    // Implement authentication logic here, for example, calling an AuthService
    if (this.loginData.username === 'admin' && this.loginData.password === 'password') {
      // Redirect to the admin page on successful login
      this.router.navigate(['/admin']);
    } else {
      // Handle login error
      alert('Invalid username or password');
    }
  }
}