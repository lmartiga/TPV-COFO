import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FuellingPointsRootComponent } from './fuelling-points-root.component';

describe('FuellingPointsRootComponent', () => {
  let component: FuellingPointsRootComponent;
  let fixture: ComponentFixture<FuellingPointsRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FuellingPointsRootComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FuellingPointsRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
