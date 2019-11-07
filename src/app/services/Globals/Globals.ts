import { Injectable } from '@angular/core';
import { Status } from './Status';

@Injectable()
export abstract class Globals {
  static statusPump: Status[] = [];

  static Set(fuellingPointId: number, status: boolean) {
    this.statusPump.push({id: fuellingPointId, status: status});
  }

  static Put(fuellingPointId: number, status: boolean) {
    this.statusPump.find(s => s.id === fuellingPointId).status = status;
  }

  static Get() {
    return this.statusPump;
  }

  static Delete() {
    this.statusPump = [];
  }
}

