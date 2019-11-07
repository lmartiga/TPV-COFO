import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RunawayComponent } from './runaway.component';

describe('RunawayComponent', () => {
  let component: RunawayComponent;
  let fixture: ComponentFixture<RunawayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RunawayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RunawayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
