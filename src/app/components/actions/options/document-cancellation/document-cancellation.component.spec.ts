import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentCancellationComponent } from './document-cancellation.component';

describe('DocumentCancellationComponent', () => {
  let component: DocumentCancellationComponent;
  let fixture: ComponentFixture<DocumentCancellationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentCancellationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentCancellationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
