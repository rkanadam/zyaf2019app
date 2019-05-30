import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {flatMap, map, mergeMap, tap} from 'rxjs/operators';
import {MatSnackBar, MatTable, MatTableDataSource} from '@angular/material';

declare const gapi: any;
// const baseURL = 'http://localhost:3000';
const baseURL = 'https://slides.ssbcsj.org/zyaf2019api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  topSadhakas = new MatTableDataSource();
  sadhanas = new MatTableDataSource();
  displayedColumns: string[] = ['subscribed', 'category', 'name', 'myPoints', 'points'];
  summaryColumns: string[] = ['name', 'points'];
  wereColumnsRendered = false;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {
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
        mergeMap(() => this.fetchSadhanas()),
      )
      .subscribe();
  }

  private fetchSadhanas() {
    this.wereColumnsRendered = false; // this is a terrible hack, however I'm crazy short on time.
    return this.http.get(`${baseURL}/sadhanas`, {withCredentials: true})
      .pipe(
        map((sadhanas: any[]) => {
          this.sadhanas.data = sadhanas;
        }),
        flatMap(() => {
          return this.http.get(`${baseURL}/sadhanas/top`, {withCredentials: true});
        }),
        map((topSadhakas: any[]) => {
          this.topSadhakas.data = topSadhakas;
        }),
        tap(() => {
          window.setTimeout(() => {
            if (!this.wereColumnsRendered) {
              window.location.reload(true);
            }
          }, 2000);
        })
      );
  }

  private categoryToHref(category?: string) {
    this.wereColumnsRendered = true;
    category = (category || '').toLowerCase().replace(/\s/g, '');
    switch (category) {
      case 'dailyprayersandmeditation':
        return '#dailyPrayersAndMeditation';
      case 'healthyliving':
        return '#healthyLiving';
      case 'servicetoothers':
        return '#serviceToOthers';
      case 'gogreen':
        return '#goGreen';
      case 'ceilingondesires':
        return '#cod';
      case 'sailiterature':
        return '#saiLiterature';
      default:
        return '#app';
    }
  }


  private subcribeToSadhana(sadhanaId: string) {
    this.http
      .post(`${baseURL}/my/sadhanas/${sadhanaId}`, {}, {
        withCredentials: true
      })
      .pipe(
        mergeMap(() => this.fetchSadhanas()),
      )
      .subscribe(() => {
        this.snackBar.open(`One step! One step at a time`);
      });
  }

  private unsubcribeToSadhana(sadhanaId: string) {
    this.http
      .delete(`${baseURL}/my/sadhanas/${sadhanaId}`, {
        withCredentials: true
      })
      .pipe(
        mergeMap(() => this.fetchSadhanas()),
      )
      .subscribe(() => {
        this.snackBar.open(`Got it! Quality is better than quantity`);
      });
  }

  private sadhanaPerformed(sadhanaId: number) {
    this.http
      .post(`${baseURL}/my/sadhanas/${sadhanaId}/performed`, {}, {
        withCredentials: true
      })
      .pipe(
        mergeMap(() => this.fetchSadhanas()),
      )
      .subscribe(() => {
        this.snackBar.open(`Whee hoo! Say Sairam!`);
      });
  }

  applyFilter(filterValue: string) {
    this.sadhanas.filter = filterValue.trim().toLowerCase();
  }

  toggleSadhana(element, addSadhana: boolean) {
    if (addSadhana) {
      this.subcribeToSadhana(element['ROWID']);
    } else {
      this.unsubcribeToSadhana(element['ROWID']);
    }
  }

  isSadhanaSubscribedTo(element) {
    return element['EMAIL'] ? true : false;
  }

  private formatNameForTopSadhakasTable(row) {
    return JSON.parse(row.SIGNIN_PAYLOAD).name;
  }
}
