import { Component, OnInit, AfterViewInit, HostBinding, Input, ElementRef, ViewChild } from '@angular/core';
import { Document } from 'app/shared/document/document';
import { Currency } from 'app/shared/currency/currency';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { CurrencyPriorityType } from 'app/shared/currency/currency-priority-type.enum';
import { LanguageService } from 'app/services/language/language.service';
import { LogHelper } from 'app/helpers/log-helper';

@Component({
  selector: 'tpv-preview-document',
  templateUrl: './preview-document.component.html',
  styleUrls: ['./preview-document.component.scss']
})
export class PreviewDocumentComponent implements OnInit, AfterViewInit {
  @HostBinding('class') class = 'tpv-preview-document';
  @Input() ticket: Document;
  // as this component is shared, the action button container heigth is variable, so we need reference to that wrapper
  @Input() actionButtonWrapper: ElementRef;
  @ViewChild('headerPreview') private _headerPreview: ElementRef;
  @ViewChild('wrapperTablePreview') private _wrapperTablePreview: ElementRef;
  currencyInfo: Currency;
  actived: boolean = false;

  constructor(
    private _appDataConfig: AppDataConfiguration,
    private _languageService: LanguageService,
    private  _logHelper: LogHelper
  ) { }

  ngOnInit() {
    window.addEventListener('resize', () => this.setHeightDocumentTable());
    const baseCurrency = this._appDataConfig.currencyList.find(c => c.priorityType == CurrencyPriorityType.base);
    if (baseCurrency != undefined) {
      this.currencyInfo = baseCurrency;
    } else {
      this._logHelper.trace('PreviewDocumentComponent-> WARNING: No se ha podido recuperar la divisa base');
    }
  }
  ngAfterViewInit() {
    this.setHeightDocumentTable();
  }
  /* Calcula el alto maximo de la tabla para evitar colapsos, debe hacerse mediante jQuery */
  private setHeightDocumentTable() {
    if (this._headerPreview == undefined ||
      this.actionButtonWrapper == undefined ||
      this._wrapperTablePreview == undefined) {
      this._logHelper.trace('Unable to set heigth of preview document table');
      return;
    }
    let windowHeight = jQuery(window).height();
    this._logHelper.trace(`window height: ${windowHeight}`);
    let headerPreviewHeight = jQuery(this._headerPreview.nativeElement).outerHeight();
    this._logHelper.trace(`header preview height: ${headerPreviewHeight}`);
    this._logHelper.trace(this._headerPreview.nativeElement);
    let actionButtonWrapperHeight = jQuery(this.actionButtonWrapper).height();
    this._logHelper.trace(`action button height: ${actionButtonWrapperHeight}`);
    let maxHeight = windowHeight - headerPreviewHeight - actionButtonWrapperHeight;
    let paddingHeight = 100; // alto del titulo y paddings (aproximado)

    jQuery(this._wrapperTablePreview.nativeElement).css('max-height', maxHeight - paddingHeight);
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
