import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeDeliveredComponent } from './change-delivered.component';

describe('ChangeDeliveredComponent', () => {
  let component: ChangeDeliveredComponent;
  let fixture: ComponentFixture<ChangeDeliveredComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeDeliveredComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeDeliveredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
