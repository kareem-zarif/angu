import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductDetails } from './product-details';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ProductDetails', () => {
  let component: ProductDetails;
  let fixture: ComponentFixture<ProductDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'prod-001' })
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProductDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
