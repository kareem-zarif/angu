import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryCursor } from './category-cursor';

describe('CategoryCursor', () => {
  let component: CategoryCursor;
  let fixture: ComponentFixture<CategoryCursor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryCursor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryCursor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
