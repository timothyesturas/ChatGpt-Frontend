import {
  Component,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  AuthService
} from '../services/auth';


@Component({
  selector: 'app-login',

  imports: [
    FormsModule
  ],

  templateUrl: './login.html',

  styleUrl: './login.css'
})
export class Login {

  private authService =
    inject(AuthService);

  private router =
    inject(Router);


  email = '';

  password = '';

  loading = false;

  errorMessage = '';


  login(): void {

    this.errorMessage = '';


    const email =
      this.email.trim();

    const password =
      this.password;


    if (!email || !password) {

      this.errorMessage =
        'Please enter your email and password.';

      return;

    }


    this.loading = true;


    this.authService
      .login(
        email,
        password
      )
      .subscribe({

        next: () => {

          this.loading = false;

          this.router.navigate([
            '/chat'
          ]);

        },


        error: (error) => {

          console.error(
            'Login failed:',
            error
          );


          this.loading = false;


          if (
            error?.error?.message
          ) {

            this.errorMessage =
              error.error.message;

          } else {

            this.errorMessage =
              'Invalid email or password.';

          }

        }

      });

  }


  goToRegister(): void {

    this.router.navigate([
      '/register'
    ]);

  }

}