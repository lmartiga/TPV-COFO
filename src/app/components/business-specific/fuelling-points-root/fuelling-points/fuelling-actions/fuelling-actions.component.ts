import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { LanguageService } from 'app/services/language/language.service';
@Component({
  selector: 'tpv-fuelling-actions',
  templateUrl: './fuelling-actions.component.html',
  styleUrls: ['./fuelling-actions.component.scss']
})
export class FuellingActionsComponent implements OnInit {

  @Output() btnStopClickEvent = new EventEmitter<boolean>();
  @Output() btnNightClickEvent = new EventEmitter<boolean>();
  @Output() btnTransactionsClickEvent = new EventEmitter<boolean>();

  // track the checked status of button stop
  @Input()
  btnStopChecked: boolean = false;
  // track the checked status of button nigth
  @Input()
  btnNightChecked: boolean = false;

  constructor(private _languageService: LanguageService
  ) { }

  ngOnInit() {

  }
  btnStopClick() {
    this.btnStopClickEvent.emit(!this.btnStopChecked);
  }
  btnNigthClick() {
    this.btnNightClickEvent.emit(!this.btnNightChecked);
  }
  btnWaitOpsClick(): void {
    this.btnTransactionsClickEvent.emit(true);
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
    }
}
