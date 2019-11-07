import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentSearchAnulacionParcialComponent } from './document-search-anulacion-parcial.component';

describe('DocumentSearchComponent', () => {
  let component: DocumentSearchAnulacionParcialComponent;
  let fixture: ComponentFixture<DocumentSearchAnulacionParcialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentSearchAnulacionParcialComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentSearchAnulacionParcialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
