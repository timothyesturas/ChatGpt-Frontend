import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, tap } from 'rxjs';


export interface AuthUser {

  id: string;

  email: string;

}


export interface AuthResponse {

  access_token: string;

  user: AuthUser;

}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);


  private readonly apiUrl =
    'http://localhost:3000/api/auth';


  login(
    email: string,
    password: string
  ): Observable<AuthResponse> {

    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/login`,
        {
          email,
          password
        }
      )
      .pipe(

        tap(response => {

          localStorage.setItem(
            'access_token',
            response.access_token
          );

          localStorage.setItem(
            'auth_user',
            JSON.stringify(response.user)
          );

        })

      );

  }


  register(
    email: string,
    password: string
  ): Observable<AuthResponse> {

    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/register`,
        {
          email,
          password
        }
      );

  }


  logout(): void {

    localStorage.removeItem(
      'access_token'
    );

    localStorage.removeItem(
      'auth_user'
    );

  }


  getToken(): string | null {

    return localStorage.getItem(
      'access_token'
    );

  }


  getUser(): AuthUser | null {

    const user =
      localStorage.getItem(
        'auth_user'
      );

    if (!user) {
      return null;
    }


    try {

      return JSON.parse(user) as AuthUser;

    } catch {

      return null;

    }

  }


  isLoggedIn(): boolean {

    return !!this.getToken();

  }


  me(): Observable<AuthUser> {

    return this.http
      .get<AuthUser>(
        `${this.apiUrl}/me`
      );

  }

}