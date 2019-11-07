import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FuellingPointTestComponent } from './fuelling-point-test.component';

describe('FuellingPointTestComponent', () => {
  let component: FuellingPointTestComponent;
  let fixture: ComponentFixture<FuellingPointTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FuellingPointTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FuellingPointTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
