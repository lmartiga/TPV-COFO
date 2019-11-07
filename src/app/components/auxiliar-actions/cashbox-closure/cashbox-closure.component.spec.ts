import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashboxClosureComponent } from './cashbox-closure.component';

describe('CashboxClosureComponent', () => {
  let component: CashboxClosureComponent;
  let fixture: ComponentFixture<CashboxClosureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CashboxClosureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashboxClosureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
