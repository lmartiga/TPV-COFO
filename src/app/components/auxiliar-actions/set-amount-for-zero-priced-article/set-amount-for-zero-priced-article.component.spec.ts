import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetAmountForZeroPricedArticleComponent } from './set-amount-for-zero-priced-article.component';

describe('SetAmountForZrtoPricedArticleComponentEditDocumentLineComponent', () => {
  let component: SetAmountForZeroPricedArticleComponent;
  let fixture: ComponentFixture<SetAmountForZeroPricedArticleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetAmountForZeroPricedArticleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetAmountForZeroPricedArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
