import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupplierList } from './supplier-list';
import { RouterTestingModule } from '@angular/router/testing';

describe('SupplierList', () => {
  let component: SupplierList;
  let fixture: ComponentFixture<SupplierList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierList, RouterTestingModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SupplierList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
