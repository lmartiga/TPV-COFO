import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PumpAuxComponent } from './pump-aux.component';

describe('PumpAuxComponent', () => {
  let component: PumpAuxComponent;
  let fixture: ComponentFixture<PumpAuxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PumpAuxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PumpAuxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
