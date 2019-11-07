import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class HttpService {
  private response: Observable<Response>;
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(
    private _http: Http
  ) {
  }

  private extractData(res: Response): any {
    const body = res.json();
    return body || {};
  }

  getJsonObservable(url: string, params?: any): Observable<any> {
    this.response = this._http.get(
      url,
      new RequestOptions({headers: this.headers, params: params}));

    return this.response.map(res => this.extractData(res));
  }

  postJsonObservable(url: string, body: any): Observable<any> {
    this.response = this._http.post(
      url,
      body,
      new RequestOptions({headers : this.headers})
    );

    return this.response.map(res => this.extractData(res));
  }

  async getJsonPromiseAsync(url: string, params?: any): Promise<any> {
    const response = await this._http.get(url, { headers: this.headers, params }).toPromise();
    return this.extractData(response);
  }

  async postJsonPromiseAsync(url: string, body: any): Promise<any> {
    const response = await this._http.post(url, body, { headers : this.headers }).toPromise();
    return this.extractData(response);
  }
}
