import { Injectable, OnDestroy } from '@angular/core';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { Literal } from 'app/shared/language/literal';
import { Subscription } from 'rxjs/Subscription';
import { IDictionaryStringKey } from 'app/shared/idictionary';

@Injectable()
export class LanguageService implements OnDestroy {
  private _literalsList: Literal[] = [];

  private _onLiteralsUpdated: Subscription;

  constructor(
    private _appDataConfig: AppDataConfiguration,
  ) {
    }


  ngOnDestroy() {
    if (this._onLiteralsUpdated != undefined) {
      this._onLiteralsUpdated.unsubscribe();
    }
  }

  /**
   * Recupera un literal de la lista de literales (que previamente ha tenido que ser solicitada al servicio)
   *
   * @param {string} group grupo a buscar
   * @param {string} key clave a buscar
   * @returns {string} el literal solicitado
   * @memberof LanguageService
   */
  getLiteral(group: string, key: string): string {
    this._literalsList = this._appDataConfig.literals;
    if (this._literalsList != undefined) {
      const literal = this._literalsList.find(l => l.group.toUpperCase() == group.toUpperCase() &&
        l.key.toUpperCase() == key.toUpperCase());
      if (literal != undefined) {
          return literal.value;
      }
    } else {
      // Esto no debería pasar nunca, porque la lista está inicializada aquí,
      // y el sertvicio nunca debería devolver lista nula
      // this._logHelper.logError('Ha ocurrido un error inesperado. La lista de literales es undefined');
    }

    return '{' + key + '}';
  }

  getPrintingLiterals(): IDictionaryStringKey<string> {
    const literalsResult: IDictionaryStringKey<string> = {};
    this._literalsList = this._appDataConfig.literals;
    if (this._literalsList == undefined) {
      return literalsResult;
    }
    this._literalsList.filter(l => l.group.toLowerCase() == 'printing_template')
      .forEach(l => {
        literalsResult[l.key] = l.value;
      });
    return literalsResult;

  }
}
