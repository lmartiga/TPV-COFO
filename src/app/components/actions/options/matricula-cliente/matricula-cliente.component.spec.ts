import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatriculaClienteComponent } from './matricula-cliente.component';

describe('MatriculaClienteComponent', () => {
  let component: MatriculaClienteComponent;
  let fixture: ComponentFixture<MatriculaClienteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MatriculaClienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatriculaClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
