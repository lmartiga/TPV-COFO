import { Injectable } from '@angular/core';

@Injectable()
export class ScreenService {

  constructor() { }

  bindClickToRequestFullScreen(): void {
    const documentElement = window.document.documentElement as any;
    const requestFullScreen = documentElement.requestFullscreen ||
                              documentElement.webkitRequestFullscreen ||
                              documentElement.mozRequestFullScreen ||
                              documentElement.msRequestFullscreen;
    requestFullScreen.call(documentElement);
  }
}
