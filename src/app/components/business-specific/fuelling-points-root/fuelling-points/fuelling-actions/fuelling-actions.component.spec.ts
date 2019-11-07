import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FuellingActionsComponent } from './fuelling-actions.component';

describe('FuellingActionsComponent', () => {
  let component: FuellingActionsComponent;
  let fixture: ComponentFixture<FuellingActionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FuellingActionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FuellingActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
