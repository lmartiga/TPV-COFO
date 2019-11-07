import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PluComponent } from './plu.component';

describe('PluComponent', () => {
  let component: PluComponent;
  let fixture: ComponentFixture<PluComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PluComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PluComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
