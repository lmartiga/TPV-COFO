import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CashEntryComponent } from './cash-entry.component';

describe('CashEntryComponent', () => {
  let component: CashEntryComponent;
  let fixture: ComponentFixture<CashEntryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CashEntryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CashEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
