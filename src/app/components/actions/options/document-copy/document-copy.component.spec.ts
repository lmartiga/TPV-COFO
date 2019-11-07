import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopiaComponent } from './document-copy.component';

describe('CopiaComponent', () => {
  let component: CopiaComponent;
  let fixture: ComponentFixture<CopiaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopiaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
