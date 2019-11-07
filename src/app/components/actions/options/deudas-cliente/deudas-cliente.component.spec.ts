import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeudasClienteComponent } from './deudas-cliente.component';

describe('DeudasClienteComponent', () => {
  let component: DeudasClienteComponent;
  let fixture: ComponentFixture<DeudasClienteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeudasClienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeudasClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
