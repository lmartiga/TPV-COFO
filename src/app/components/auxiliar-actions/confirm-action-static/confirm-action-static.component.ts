import { Component, OnInit, Input } from '@angular/core';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { LanguageService } from 'app/services/language/language.service';

@Component({
  selector: 'tpv-confirm-action-static',
  templateUrl: './confirm-action-static.component.html',
  styleUrls: ['./confirm-action-static.component.scss']
})
export class ConfirmActionStaticComponent implements OnInit {
  @Input() wantStopPump: boolean;
  @Input() externalpopup: boolean;
  textQuestion: string = this.getLiteral('confirm_action_static', 'literal_ConfirmActionStatic_AreYouSure');
  btnaceptar: boolean = true;
  btncancelar: boolean = true; 
  titulo: string = this.getLiteral('confirm_action_static', 'literal_ConfirmActionStatic_Titulo');
  
  constructor(
    private _session: SessionInternalService,
    private _languageService: LanguageService
  ) { }

  ngOnInit() {   
     if(this.externalpopup == false)
     {
      if (this.wantStopPump) {
        this.textQuestion = this.getLiteral('confirm_action_static', 'literal_ConfirmActionStatic_Parar');
      } else {
        this.textQuestion = this.getLiteral('confirm_action_static', 'literal_ConfirmActionStatic_Activar');
      }
     }else{
      this.btncancelar = false;      
      this.textQuestion = this.getLiteral('confirm_action_static', 'literal_ConfirmActionStatic_Barcode');
     }
    
  }

  fnCancelClick() {
    this._session.onClickConfirmAction(false);
  }

  fnConfirmClick() {
    this._session.onClickConfirmAction(true);
  }
  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }
}
