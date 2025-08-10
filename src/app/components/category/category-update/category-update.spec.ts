import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryUpdate } from './category-update';

describe('CategoryUpdate', () => {
  let component: CategoryUpdate;
  let fixture: ComponentFixture<CategoryUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
