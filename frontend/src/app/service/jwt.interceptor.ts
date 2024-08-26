import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Define the public endpoints that should not require a JWT token
    const publicEndpoints = [
      '/api/login',
      '/api/logout',
      '/api/index'
    ];

    // Check if the request is for a public endpoint
    const isPublicEndpoint = publicEndpoints.some(url => req.url.includes(url));

    // If not a public endpoint, clone the request and add the authorization header
    if (!isPublicEndpoint && this.authService.isLoggedIn()) {
      const authToken = this.authService.getToken();
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
    }

    return next.handle(req);
  }
}
