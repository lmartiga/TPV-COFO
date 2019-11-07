import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewDocumentComponent } from './preview-document.component';

describe('PreviewDocumentComponent', () => {
  let component: PreviewDocumentComponent;
  let fixture: ComponentFixture<PreviewDocumentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviewDocumentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
