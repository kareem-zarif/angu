import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SellerProfile } from './seller-profile';

describe('SellerProfile', () => {
  let component: SellerProfile;
  let fixture: ComponentFixture<SellerProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SellerProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SellerProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
