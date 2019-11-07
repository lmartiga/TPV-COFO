import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuxiliarActionsComponent } from './fuelling-points-auxiliar-actions.component';

describe('AuxiliarActionsComponent', () => {
  let component: AuxiliarActionsComponent;
  let fixture: ComponentFixture<AuxiliarActionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuxiliarActionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuxiliarActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
