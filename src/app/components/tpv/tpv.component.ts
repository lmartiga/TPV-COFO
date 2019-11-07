import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, HostBinding, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MdDrawer } from '@angular/material';

import { KeyboardInternalService } from 'app/services/keyboard/keyboard-internal.service';
import { LayoutBuilderService } from 'app/services/layout/layout-builder.service';
import { OverlayService } from 'app/services/overlay/overlay.service';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { Subscription } from 'rxjs/Subscription';
import { SidebarResponse } from 'app/shared/sidebards/sidebar-response';
import { SidebarType } from 'app/shared/sidebards/sidebar-type';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-root',
  templateUrl: './tpv.component.html',
  styleUrls: ['./tpv.component.scss']
})
export class TPVComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mainContainerHost', { read: ViewContainerRef }) private mainViewContainerRef: ViewContainerRef;
  @ViewChild('drawer') private _drawer: MdDrawer;
  @HostBinding('class') class = 'tpv-root';

  initialized: boolean = false;
  showKeyboard: boolean = false;
  styleOpenOrClose: boolean = false;
  private _possibleOverlayId: string;
  private _subscriptions: Subscription[] = [];
  visibleSidebarInfo: boolean = false;
  showSidebard: SidebarResponse = {
    openOrClose: false,
    sidebarType: SidebarType.lookScreen
  };
  onReceive: any;
  constructor(
    private _layoutBuilder: LayoutBuilderService,
    private _keyboardInternalSrv: KeyboardInternalService,
    private _overlay: OverlayService,
    private _session: SessionInternalService,
    private changeDetector: ChangeDetectorRef,
    private _electronicJournalService: ElectronicJournalService,
    private  _logHelper: LogHelper

    ) {
      window.addEventListener('resize', () => {
        jQuery('.side-bar-fullscreen[_ngcontent-c2]').css({'padding-left': jQuery('tpv-fuelling-points-root').width() + 'px', 'width': '100%'});
      });
      this._logHelper.trace('TPVComponent created');
    }

    ngOnInit(): void {
      this._layoutBuilder.parseLayoutConfigurationAndBuildComponentTree(this.mainViewContainerRef);

      this._subscriptions.push(this._keyboardInternalSrv.showKeyBoard$.subscribe(dato => {
        if (dato) {
          this.showKeyboard = true;
        } else {
          this.showKeyboard = false;
        }
      }));

      this._overlay.onClick().subscribe(dato => {
        if (this._possibleOverlayId !== undefined) {
          this._overlay.close(this._possibleOverlayId);
          this._possibleOverlayId = undefined;

           // Electronic Journal - ocultar panel lateral de información -
           if (this._drawer.opened == true) {
            this._electronicJournalService.writeAction({
              type: ActionType.customMessage,
              genericDetail: 'Information sidenav panel closed',
              });
          }

        this._drawer.toggle();
      }
    });

    this.onReceive = this._receiveMessage.bind(this);
        if (window.addEventListener) {

            window.addEventListener('message', this.onReceive, false);

        } else {

            (<any>window).attachEvent('onmessage', this.onReceive);

        }
  }
  onKeydown(event: any) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      if (this.styleOpenOrClose) {
        this._drawer.open();
      } else {
        this._drawer.close();
      }
    }
  }

  ngOnDestroy() {
    this._subscriptions.forEach(s => s.unsubscribe());
  }

  onDetectClickableInDOM(): void {
    if (!this._drawer.opened) {
      this.showSidebard.openOrClose = false;
      this._session.fnClickedInDOM(this.showSidebard);
    } else if (this.showSidebard.sidebarType == SidebarType.about) {
      this.showSidebard.openOrClose = false;
      this._session.fnClickedInDOM(this.showSidebard);
    }
  }

  ngAfterViewInit(): void {
    this._subscriptions.push(this._session.openSidebar$.subscribe(response => {
      if (response != undefined) {
        if (response.openOrClose) {
          this.styleOpenOrClose = true;
          if (this._drawer.opened) {
            this._drawer.close();
          }
          this._drawer.open();
          if (response.sidebarType == SidebarType.lookScreen) {
            this.showLookScreen();
          } else {
            this.showAboutInfo();
          }
        }
      }
    }));

    this._subscriptions.push(this._session.isOperatorConnect$.subscribe(isConnected => {
      if (isConnected) {
        this.styleOpenOrClose = false;
        // jQuery('.side-bar-fullscreen[_ngcontent-c2]').css({'padding-left': '0px', 'width': '100%'});
        this.onDetectClickableInDOM();
        this._drawer.close();
      }
    }));
  }

  showLookScreen(): void {
    this.visibleSidebarInfo = false;
    this.changeDetector.detectChanges();
    jQuery('.button-emergency tpv-options-auxiliar .button_ico_back_left').hide();
    jQuery('.side-bar-fullscreen[_ngcontent-c2]').css({'padding-left': jQuery('tpv-fuelling-points-root').width() + 'px', 'width': '100%'});
  }

  showAboutInfo(): void {
    this.visibleSidebarInfo = true;
    jQuery('.side-bar-fullscreen[_ngcontent-c2]').css({'padding-left': '0px', 'width': jQuery('tpv-fuelling-points-root').width() + 'px' });
  }

  getPercentage(element: JQuery<Element>): number {
    return Math.round(parseFloat(element.css('padding-left')) * 100 / parseFloat(element.css('width')));
  }

  onHiddenKeyBoard(isVisible: boolean) {
      if (isVisible) {
        jQuery('.virtual-keyboard').width('auto');
      } else {
        jQuery('.virtual-keyboard').width('0');
      }
      return isVisible;
  }
  openSlidenav() {

     // Electronic Journal - mostrar panel lateral de información-
     this._electronicJournalService.writeAction({
      type: ActionType.customMessage,
      genericDetail: 'Information sidenav panel requested',
      });

    this.showSidebard = {
      openOrClose: true,
      sidebarType: SidebarType.about
    };
    this.visibleSidebarInfo = true;
    this.styleOpenOrClose = false;
    this._session.fnClickedInDOM(this.showSidebard);
  }
  openLookScreen() {
    this.showSidebard = {
      openOrClose: true,
      sidebarType: SidebarType.lookScreen
    };
    this.styleOpenOrClose = true;
    this.visibleSidebarInfo = false ;
    this._session.fnClickedInDOM(this.showSidebard);
  }
  private _receiveMessage(e: MessageEvent) {
    if(typeof e.data == "string"){
      const valor = e.data.split('/');
      if (valor[1] == 'Barcode') {
        if (valor[0] != '') {
        this._keyboardInternalSrv.SendBarcode(valor[0]);
        }
      }
    }
  }
}
