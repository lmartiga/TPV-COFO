import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmActionStaticComponent } from './confirm-action-static.component';

describe('ConfirmActionStaticComponent', () => {
  let component: ConfirmActionStaticComponent;
  let fixture: ComponentFixture<ConfirmActionStaticComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmActionStaticComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmActionStaticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
