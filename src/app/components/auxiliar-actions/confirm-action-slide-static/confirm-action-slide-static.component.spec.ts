import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmActionSlideStaticComponent } from './confirm-action-slide-static.component';

describe('ConfirmActionSlideStaticComponent', () => {
  let component: ConfirmActionSlideStaticComponent;
  let fixture: ComponentFixture<ConfirmActionSlideStaticComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmActionSlideStaticComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmActionSlideStaticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
