import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { LoyaltyComponent } from './loyalty.component';

describe('MixtPaymentComponent', () => {
  let component: LoyaltyComponent;
  let fixture: ComponentFixture<LoyaltyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoyaltyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoyaltyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
