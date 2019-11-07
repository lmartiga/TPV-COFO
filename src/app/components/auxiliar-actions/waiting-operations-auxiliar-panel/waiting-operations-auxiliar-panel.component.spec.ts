import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitingOperationsAuxiliarPanelComponent } from './waiting-operations-auxiliar-panel.component';

describe('WaitingOperationsAuxiliarPanelComponent', () => {
  let component: WaitingOperationsAuxiliarPanelComponent;
  let fixture: ComponentFixture<WaitingOperationsAuxiliarPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WaitingOperationsAuxiliarPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WaitingOperationsAuxiliarPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
