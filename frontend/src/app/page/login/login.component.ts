import { Component } from '@angular/core';
import { AuthService, ILoginData } from 'src/app/service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginData: ILoginData = {
    username: '',
    password: ''
  };

  constructor(private auth: AuthService) { }

  ngOnInit(): void {
    this.auth.logout();
  }

  onLogin(): void {
    this.auth.login(this.loginData);

  }
}
