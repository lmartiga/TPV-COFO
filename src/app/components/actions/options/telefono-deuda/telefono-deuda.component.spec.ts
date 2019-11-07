import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TelefonoDeudaComponent } from './telefono-deuda.component';

describe('TelefonoDeudaComponent', () => {
  let component: TelefonoDeudaComponent;
  let fixture: ComponentFixture<TelefonoDeudaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TelefonoDeudaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TelefonoDeudaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
