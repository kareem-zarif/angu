import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductUpdate } from './product-update';

describe('ProductUpdate', () => {
  let component: ProductUpdate;
  let fixture: ComponentFixture<ProductUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
