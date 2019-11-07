import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutStackContainerComponent } from './layout-stack-container.component';

describe('LayoutStackContainerComponent', () => {
  let component: LayoutStackContainerComponent;
  let fixture: ComponentFixture<LayoutStackContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LayoutStackContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayoutStackContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
