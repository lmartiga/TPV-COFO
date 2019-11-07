import { Pipe, PipeTransform } from '@angular/core';
import { AppDataConfiguration } from 'app/config/app-data.config';
import { InvalidPipeArgumentError } from 'app/pipes/invalid-pipe-argument-error';

@Pipe ({name: 'round'})

export class RoundPipe implements PipeTransform {

  constructor(
    private _appDataConfiguration: AppDataConfiguration
  ) { }

  get appConfiguration(): AppDataConfiguration {
      return this._appDataConfiguration;
  }
  // devuelve un número redondeado según los decimales indicados por parámetro
  transform(value: any, decimals: number): number|undefined {
    if (isEmpty(value)) {
      return undefined;
    }
    if (isNaN(value)) {
      throw InvalidPipeArgumentError(RoundPipe, 'El valor de entrada no es un número.');
    }
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // devuelve un número redondeado según los decimales de la divisa base
  transformInBaseCurrency (value: number): number|undefined {
    if (isEmpty(value)) {
      return undefined;
    }
    if (isNaN(value)) {
      throw InvalidPipeArgumentError(RoundPipe, 'El valor de entrada no es un número.');
    }
    if (this._appDataConfiguration &&
      this._appDataConfiguration.baseCurrency &&
      this._appDataConfiguration.baseCurrency.decimalPositions) {
        const decimals = this._appDataConfiguration.baseCurrency.decimalPositions;
        return this.transform(value, decimals);
    } else {
      throw InvalidPipeArgumentError(RoundPipe, 'No se tiene información de los decimales de la divisa base.');
    }
  }

  // devuelve un número redondeado según los decimales de la divisa secundaria
  transformInSecondaryCurrency (value: number): number|undefined {
    if (isEmpty(value)) {
      return undefined;
    }
    if (isNaN(value)) {
      throw InvalidPipeArgumentError(RoundPipe, 'El valor de entrada no es un número.');
    }
    if (this._appDataConfiguration &&
      this._appDataConfiguration.secondaryCurrency &&
      this._appDataConfiguration.secondaryCurrency.decimalPositions) {
        const decimals = this._appDataConfiguration.secondaryCurrency.decimalPositions;
        return this.transform(value, decimals);
    } else {
      throw InvalidPipeArgumentError(RoundPipe, 'No se tiene información de los decimales de la divisa secundaria.');
    }
  }
}


function isEmpty(value: any): boolean {
  return value == undefined || value === '' || value !== value;
}
