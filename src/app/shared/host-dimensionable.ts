import { HostBinding } from '@angular/core';
import { IDimensionable } from 'app/shared/idimensionable';

export class HostDimensionable implements IDimensionable {
  @HostBinding('class') private _class = '';
  @HostBinding('style.height') private _height = '';
  @HostBinding('style.overflow-y') private _overflowY = '';

  set widthPercentage(percentage: number) {
    const bigScreenColSize = (percentage / 100 * 12).toFixed(0);
    const smallScreenColSize = (percentage / 100 * 18).toFixed(0);
    this._class += `col-lg-${bigScreenColSize} col-md-${bigScreenColSize} col-sm-${smallScreenColSize} col-xs-12`;
  }

  set heightPercentage(percentage: number) {
    this._height = `${percentage}%`; // El pie es más o menos un 5%
  }

  set overflowY(overflowY: string) {
    this._overflowY = overflowY;
  }
}
