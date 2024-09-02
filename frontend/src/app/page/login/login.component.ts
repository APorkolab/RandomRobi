import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

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

  currentYear: number = new Date().getFullYear();

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  onLogin(): void {
    this.authService.login(this.loginData).subscribe(
      (response: any) => {
        if (response && response.accessToken) {
          this.authService.saveToken(response.accessToken);
          this.router.navigate(['/admin']);
        } else {
          console.error('Hiányzó token a válaszból');
        }
      },
      (error: any) => {
        console.error('Bejelentkezési hiba:', error);
      }
    );
  }
}