import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriesMultilevelComponent } from './categories-multilevel.component';

describe('CategoriesMultilevelComponent', () => {
  let component: CategoriesMultilevelComponent;
  let fixture: ComponentFixture<CategoriesMultilevelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoriesMultilevelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoriesMultilevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
