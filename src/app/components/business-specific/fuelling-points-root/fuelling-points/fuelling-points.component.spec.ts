import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FuellingPointsComponent } from './fuelling-points.component';

describe('FuellingPointsComponent', () => {
  let component: FuellingPointsComponent;
  let fixture: ComponentFixture<FuellingPointsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FuellingPointsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FuellingPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
