/**
 * TODO Hay que hablar con Antonio para ver si la gestión de la respuesta del servicio
 * (ya que ahora todas las llamadas devuelven un status y un mensaje se tienen que gestionar desde cada
 * uno de los sitios donde se invoca el servicio http o se tienen que gestionar en un punto común. Hablé con él el otro día
 * y quedamos en que deberían gestionarse esas respuestas desde un sitio común (que entienda los statuses del demonio,
 * y abstraer al resto de servicios de esta lógica). Hay que ver de qué manera se programa esto).
 * En general hay que revisar todas las llamadas al demonio por si hay que actualizarlas.
 */
import { Injectable } from '@angular/core';
import { AppDataConfiguration } from 'app/config/app-data.config';

/***
 ** Application specific configuration (Not changeable by user).
****/
@Injectable()
export class FormatConfiguration {
  readonly locale = 'es-ES';

  constructor(
    private _appDataConfig: AppDataConfiguration
  ) { }

  get decimalPositionsBaseCurrency(): number {
    let decimals;
    if (this._appDataConfig.baseCurrency) {
      decimals = this._appDataConfig.baseCurrency.decimalPositions;
    }
    return decimals;
  }

  get decimalPositionsSecondaryCurrency(): number {
    let decimals;
    if (this._appDataConfig.secondaryCurrency) {
      decimals = this._appDataConfig.secondaryCurrency.decimalPositions;
    }
    return decimals;
  }

  // todo leer de configuracion
  get volumePipeFormat(): string {
    return '1.3-3';
  }
  // todo leer de configuracion
  get moneyPipeFormat(): string {
    return '1.2-2';
  }
  // todo leer de configuracion
  get unitPricePipeFormat(): string {
    return '1.3-3';
  }
  // todo leer de configuracion
  get unitPriceSymbol(): string {
    return ' p.u.';
  }
}
