import {AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {mergeMap} from 'rxjs/operators';

declare const gapi: any;
const baseURL = 'http://localhost:3000';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  myStats = [];

  constructor(private http: HttpClient) {
  }

  ngAfterViewInit() {
    window.setTimeout(() => {
        gapi.signin2.render('google-signin', {
          'scope': 'profile email',
          'width': 240,
          'height': 50,
          'longtitle': true,
          'theme': 'light',
          'onsuccess': param => this.onSignIn(param)
        });
      }, 2000
    );
  }

  private onSignIn(googleUser) {
    // Useful data for your client-side scripts:
    const profile = googleUser.getBasicProfile();
    const id_token = googleUser.getAuthResponse().id_token;
    this.http
      .post(`${baseURL}/login`, {}, {
        headers: {
          'Authorization': id_token
        },
        withCredentials: true
      })
      .pipe(
        mergeMap(stats => this.http.get(`${baseURL}/my/sadhanas/stats`, {withCredentials: true})),
      )
      .subscribe((stats: any[]) => {
        this.myStats = stats;
      });
  }


  @HostListener('document:subscribeToSadhana', ['$event'])
  onSubcribeToSadhana(ev: any) {
    const details = JSON.parse(ev.detail);
    this.http
      .post(`${baseURL}/my/sadhanas/${details.sadhanaId}`, {}, {
        withCredentials: true
      })
      .pipe(
        mergeMap(stats => this.http.get(`${baseURL}/my/sadhanas/stats`, {withCredentials: true})))
      .subscribe((stats: any[]) => {
        this.myStats = stats;
      });
  }

  @HostListener('document:unsubscribeToSadhana', ['$event'])
  onUnsubcribeToSadhana(ev: any) {
    const details = JSON.parse(ev.detail);
    this.http
      .delete(`${baseURL}/my/sadhanas/${details.sadhanaId}`, {
        withCredentials: true
      })
      .pipe(
        mergeMap(stats => this.http.get(`${baseURL}/my/sadhanas/stats`, {withCredentials: true})))
      .subscribe((stats: any[]) => {
        this.myStats = stats;
      });
  }

  @HostListener('document:didMySadhana', ['$event'])
  onSadhanaPerformed(ev: any) {
    const details = JSON.parse(ev.detail);
    this.sadhanaPerformed(details.sadhanaId);
  }

  private sadhanaPerformed(sadhanaId: number) {
    this.http
      .post(`${baseURL}/my/sadhanas/${sadhanaId}/performed`, {}, {
        withCredentials: true
      })
      .pipe(
        mergeMap(stats => this.http.get(`${baseURL}/my/sadhanas/stats`, {withCredentials: true})))
      .subscribe((stats: any[]) => {
        this.myStats = Object.assign([], stats);
      });
  }
}
