import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MixtPaymentComponent } from './mixt-payment.component';

describe('MixtPaymentComponent', () => {
  let component: MixtPaymentComponent;
  let fixture: ComponentFixture<MixtPaymentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MixtPaymentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MixtPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
