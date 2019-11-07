import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentSearchDeudasClienteComponent } from './document-search-deudas-cliente.component';

describe('DocumentSearchDeudasClienteComponent', () => {
  let component: DocumentSearchDeudasClienteComponent;
  let fixture: ComponentFixture<DocumentSearchDeudasClienteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentSearchDeudasClienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentSearchDeudasClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
