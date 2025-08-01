import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupplierSidebar } from './supplier-sidebar';

describe('SupplierSidebar', () => {
  let component: SupplierSidebar;
  let fixture: ComponentFixture<SupplierSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierSidebar]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SupplierSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
