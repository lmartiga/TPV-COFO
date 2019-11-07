import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentCancellationParcialComponent } from './document-cancellation-parcial.component';


describe('DocumentCancellationParcialComponent', () => {
  let component: DocumentCancellationParcialComponent;
  let fixture: ComponentFixture<DocumentCancellationParcialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentCancellationParcialComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentCancellationParcialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
