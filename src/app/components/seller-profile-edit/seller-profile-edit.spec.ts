import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerProfileEdit } from './seller-profile-edit';

describe('SellerProfileEdit', () => {
  let component: SellerProfileEdit;
  let fixture: ComponentFixture<SellerProfileEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerProfileEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerProfileEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
