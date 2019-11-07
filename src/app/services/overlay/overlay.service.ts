import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class OverlayService {

  private _nextUniqueId = 0;
  private isOpenfp: Boolean = false;
  private _click: Subject<MouseEvent> = new Subject();
  overlayC = document.createElement('div');

  constructor(
  ) {window.addEventListener('resize', () => this._setHostHeight()); }

  create(
    zIndex: number,
    parentElement: HTMLElement,
    customClasses?: string[],
    blnVisibilityFuelling: boolean = false): string {

    const overlay = document.createElement('div');
    this.overlayC = overlay;
    overlay.style.marginLeft = '0';
    this.isOpenfp = false;


    if (customClasses != undefined) {
      customClasses.forEach(el => overlay.classList.add(el));
    } else {
      overlay.classList.add('tpv-overlay');
    }

    if (blnVisibilityFuelling) {
      const valfpWidth = jQuery('tpv-fuelling-points').width();
      overlay.style.marginLeft = valfpWidth + 'px';
      this.isOpenfp = true;
    }

    overlay.id = `tpv-overlay${this._nextUniqueId++}`;
    overlay.style.zIndex = zIndex.toString();
    overlay.addEventListener('click', ev => this._click.next(ev));
    if (parentElement != undefined) {
      parentElement.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }
    return overlay.id;
  }

  close(uniqueId: string): void {
    const element = document.getElementById(uniqueId);
    if (element != undefined) {
      element.parentNode.removeChild(element);
    }
  }

  modifyMarginLeft(size: string) {
    this.overlayC.style.marginLeft = size;
    this.isOpenfp = true;
  }
  _setHostHeight() {
    if (this.isOpenfp) {
      const valfpWidth = jQuery('tpv-fuelling-points').width();
      this.overlayC.style.marginLeft = valfpWidth + 'px';
    }

  }

  onClick(): Observable<MouseEvent> {
    return this._click.asObservable();
  }
}
