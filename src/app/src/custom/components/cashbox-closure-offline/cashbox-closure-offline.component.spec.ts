import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashboxClosureOfflineComponent } from './cashbox-closure-offline.component';

describe('CashboxClosureOfflineComponent', () => {
  let component: CashboxClosureOfflineComponent;
  let fixture: ComponentFixture<CashboxClosureOfflineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CashboxClosureOfflineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashboxClosureOfflineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
