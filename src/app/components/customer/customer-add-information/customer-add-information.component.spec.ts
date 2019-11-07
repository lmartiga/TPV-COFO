import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerAddInformationComponent } from './customer-add-information.component';

describe('CustomerAddInformationComponent', () => {
  let component: CustomerAddInformationComponent;
  let fixture: ComponentFixture<CustomerAddInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomerAddInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerAddInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
