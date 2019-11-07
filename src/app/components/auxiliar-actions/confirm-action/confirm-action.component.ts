import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { IActionFinalizable } from 'app/shared/iaction-finalizable';
import { ConfirmActionType } from 'app/shared/confirmAction/confirm-action-type.enum';
import { Subscription } from 'rxjs/Subscription';
import { SessionInternalService } from 'app/services/session/session-internal.service';
import { LanguageService } from 'app/services/language/language.service';
/* import { OperatorService } from 'app/services/operator/operator.service'; */
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';

interface ActionButton {
  class: string;
  text: string;
  actionClick: Function;
}
@Component({
  selector: 'tpv-confirm-action',
  templateUrl: './confirm-action.component.html',
  styleUrls: ['./confirm-action.component.scss']
})
export class ConfirmActionComponent implements OnInit, OnDestroy, IActionFinalizable<boolean> {

  private _onConfirmAction: Subject<boolean> = new Subject();
  _subscriptions: Subscription[] = [];
  // default icon
  materialIcon: string = 'warning';
  // default text
  textQuestion: string = this.getLiteral('confirm_action_component', 'literal_ConfirmAction_AreYouSure');
  // default title
  textTitle: string = this.getLiteral('confirm_action_component', 'literal_ConfirmAction_Title');
  // default type
  type: ConfirmActionType = ConfirmActionType.Warning;
  // availaleButtons
  confirmActions = new Array<ActionButton>();
  constructor(
    private _session: SessionInternalService,
    private _languageService: LanguageService,
    private _electronicJournalService: ElectronicJournalService,
    /* private _operadorService: OperatorService */
  ) { }

  /* IActionFinalizable */
  onFinish() {
    return this._onConfirmAction.asObservable();
  }
  forceFinish() {
    if (this.type == ConfirmActionType.NonInteractive) {
      // Electronic Journal - messagePanelClosed [DENIED]
      this._electronicJournalService.writeAction({
        type: ActionType.messagePanelClosed,
        genericDetail: 'Denied by System',
      });
    } else {
      // Electronic Journal - messagePanelClosed
      if (this.type != ConfirmActionType.Alert) {
        this._electronicJournalService.writeAction({
          type: ActionType.messagePanelClosed,
        });
      }
    }
    this._onConfirmAction.next(undefined);
  }
  /* end IActionFinalizable*/
  ngOnInit() {
    this._subscriptions.push(this._session.clickConfirmActionDispenser$.subscribe(data => {
      if (data) {
        this.actionYes();
      } else {
        this.actionNo();
      }
    }));
  }
  ngOnDestroy(): void {
    this._subscriptions.forEach(p => p.unsubscribe());
  }
  confirmAction(
    textQuestion: string = this.getLiteral('confirm_action_component', 'literal_ConfirmAction_AreYouSure'),
    textYes: string = this.getLiteral('confirm_action_component', 'literal_ConfirmAction_Yes'),
    textNo: string = this.getLiteral('confirm_action_component', 'literal_ConfirmAction_No'),
    title: string = this.getLiteral('confirm_action_component', 'literal_ConfirmAction_Title'),
    type: ConfirmActionType = ConfirmActionType.Warning,
  ) {
    this.textQuestion = textQuestion;
    this.textTitle = title;
    this.type = type;
    const bootstrap50 = 'col-xs-6';
    const bootstrap100 = 'col-xs-12';
    switch (type) {
      case ConfirmActionType.Alert:
        this.materialIcon = 'warning';
        this.addActionButton(textYes, bootstrap50, () => this.actionYes());
        break;
      case ConfirmActionType.Warning:
        this.materialIcon = 'warning';
        this.addActionButton(textYes, bootstrap50, () => this.actionYes());
        this.addActionButton(textNo, bootstrap50, () => this.actionNo());
        break;
      case ConfirmActionType.Question:
        this.materialIcon = 'help';
        this.addActionButton(textYes, bootstrap50, () => this.actionYes());
        this.addActionButton(textNo, bootstrap50, () => this.actionNo());
        break;
      case ConfirmActionType.Error:
      case ConfirmActionType.Information:
        this.materialIcon = 'highlight_off';
        this.addActionButton(textYes, bootstrap100, () => this.actionYes());
        break;
      case ConfirmActionType.None:
      default:
        this.materialIcon = 'highlight_off';
        break;
    }
     // Electronic Journal - messagePanelShown
     if (type != ConfirmActionType.Alert) {
      this._electronicJournalService.writeAction({
        type: ActionType.messagePanelShown,
        genericDetail: textQuestion,
      });
    }
  }

  private actionYes() {
     // Electronic Journal - messagePanelAcepted
     if (this.type != ConfirmActionType.Alert) {
      this._electronicJournalService.writeAction({
      type: ActionType.messagePanelAcepted,
    });
  }
    this._onConfirmAction.next(true);
  }

  private actionNo() {
     // Electronic Journal - messagePanelCancelled
     if (this.type != ConfirmActionType.Alert) {
      this._electronicJournalService.writeAction({
        type: ActionType.messagePanelCancelled,
      });
    }
    this._onConfirmAction.next(false);
  }

  setClassIcon() {
    return {
      'coacIcon': true,
      'iconAlert': this.type == ConfirmActionType.Alert,
      'iconError': this.type == ConfirmActionType.Error,
      'iconInformation': this.type == ConfirmActionType.Information,
      'iconWarning': this.type == ConfirmActionType.Warning,
      'iconQuestion': this.type == ConfirmActionType.Question
    };
  }

  // inserta un boton de accion para el cuadro
  private addActionButton(text: string, bootstrapClass: string, action: Function): void {
    this.confirmActions.push({
      class: `noP ${bootstrapClass}`,
      text: text,
      actionClick: action
    });
  }

  getLiteral(group: string, key: string): string {
    return this._languageService.getLiteral(group, key);
  }

}
