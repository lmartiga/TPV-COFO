import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentCopyAnulacionParcialComponent } from './document-copy-anulacion-parcial.component';

describe('CopiaComponent', () => {
  let component: DocumentCopyAnulacionParcialComponent;
  let fixture: ComponentFixture<DocumentCopyAnulacionParcialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentCopyAnulacionParcialComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentCopyAnulacionParcialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
