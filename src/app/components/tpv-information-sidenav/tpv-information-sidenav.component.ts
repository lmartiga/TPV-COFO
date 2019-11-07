import { Component, OnInit, HostBinding } from '@angular/core';
import { MinimumNeededConfiguration } from 'app/config/minimum-needed.config';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { LanguageService } from 'app/services/language/language.service';
import { ElectronicJournalService } from 'app/services/electronic-journal/electronic-journal.service';
import { ActionType } from 'app/shared/electronic-journal/action-type.enum';

@Component({
    selector: 'tpv-information-sidenav',
    templateUrl: './tpv-information-sidenav.component.html',
    styleUrls: ['./tpv-information-sidenav.component.scss']
})

export class TpvInformationSidenavComponent implements OnInit {
    @HostBinding('class') class = 'tpv-information-sidenav';

    operatorPanelHelpLiteral: string;
    constructor(
        private _conf: MinimumNeededConfiguration,
        private appDataSvc: AppDataConfiguration,
        private _languageService: LanguageService,
        private _electronicJournal: ElectronicJournalService,
    ) { }
    getLiteral(group: string, key: string): string {
        return this._languageService.getLiteral(group, key);
    }
    get logo(): string {
        return this._conf.logoURL;
    }

    get storeName(): string {
        const shop = this.appDataSvc.shop;
        return shop == undefined || shop.shopName == undefined || shop.shopName.trim() == '' ? '-' : shop.shopName;
    }

    get tpvVersion(): string {
        const version = this._conf.tpvVersion;
        return version == undefined || version.trim() == '' ? '-' : version;
    }
    get tpvNumber(): string {
        const posInfo = this._conf.POSInformation;
        return posInfo == undefined || posInfo.code == undefined || posInfo.code.trim() == '' ? '-' : posInfo.code;
    }
    ngOnInit() {
    }

    openHelp() {
         // Electronic Journal - button help (Custom message)
         this._electronicJournal.writeAction({
            type: ActionType.customMessage,
            buttonCaption: this.operatorPanelHelpLiteral,
            genericDetail: 'requested'
        });

        (window as any).smartsupp('chat:open');
    }
}

