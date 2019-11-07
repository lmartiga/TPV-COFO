import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { SessionInternalService } from 'app/services/session/session-internal.service';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { keyboardstatic } from 'app/shared/Keyboard/keyboard-static';
import { SidebarType } from 'app/shared/sidebards/sidebar-type';
import { SidebarResponse } from 'app/shared/sidebards/sidebar-response';

@Component({
  selector: 'tpv-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  private _subscriptions: Subscription[] = [];
  timeOutSession: number = 10000;
  setTime: NodeJS.Timer = undefined;
  responseKeyboard: keyboardstatic = {
    tipo: 4,
    value: '',
    intro: 'enter',
    isPassword: true
  };
  showSidebard: SidebarResponse = {
    openOrClose: true,
    sidebarType: SidebarType.lookScreen
  };
  visibleSidebarInfo: boolean = false;

  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _session: SessionInternalService
    ) { }

  ngOnInit() {
    this.setTimeForSuspendedTPV();
    this.controlInactivityOperator();
    this._subscriptions.push(this._session.clickedInDOM$.subscribe(response => {
      if (response != undefined) {
        if (response.openOrClose) {
          if (response.sidebarType == SidebarType.lookScreen) {
            this.fnLogOutOperatorAndCleanKeyboard();
          } else {
            this.visibleSidebarInfo = true;
            this.controlInactivityOperator();
            this._session.fnOpenSidebar(response);
          }
        } else {
          this.controlInactivityOperator();
        }
      }
    }));
  }

  controlInactivityOperator(): void {
    clearTimeout(this.setTime);
    this.setTime = setTimeout(() => {
      this.fnLogOutOperatorAndCleanKeyboard();
    }, this.timeOutSession);
  }

  fnLogOutOperatorAndCleanKeyboard(): void {
    this.visibleSidebarInfo = false;
    this.showSidebard = {
      openOrClose: true,
      sidebarType: SidebarType.lookScreen
    };
    this._session.fnOpenSidebar(this.showSidebard);

    // #Hack para establecer el tipo de teclado despues de mostrar el elemento
    setTimeout(() => {
      this._session.fnCleanKeyboardSession(this.responseKeyboard);
    }, 0);
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  setTimeForSuspendedTPV () {
    const timeInSecondToSuspended = this._appDataConfig.getConfigurationParameterByName('SECOND_SUSPENDED_TPV', 'GENERAL');
    if (timeInSecondToSuspended != undefined) {
      this.timeOutSession = parseInt(timeInSecondToSuspended.meaningfulStringValue + '000', 0);
    }
  }
}
