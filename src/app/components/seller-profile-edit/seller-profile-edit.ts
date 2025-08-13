import { Component, OnInit } from '@angular/core';
import { SellerProfileData, SellerService } from '../../services/seller.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seller-profile-edit',
  imports: [FormsModule, CommonModule],
  templateUrl: './seller-profile-edit.html',
  styleUrl: './seller-profile-edit.css'
})
export class SellerProfileEdit implements OnInit {
   profile: SellerProfileData | null = null;
  formData: SellerProfileData = {
    storeName: '',
    businessType: '',
    description: '',
    phoneNumber: '',
    address: '',
    websiteUrl: '',
    storeLogoUrl: ''
  };

  constructor(private sellerService: SellerService) {}

  ngOnInit(): void {
    this.sellerService.getProfileStatus(true).subscribe(status => {
      if (status.profileData) {
        this.profile = status.profileData;
        this.formData = { ...status.profileData };
      }
    });
  }

  updateProfile() {
    this.sellerService.updateProfile(this.formData).subscribe(() => {
      alert('✅ تم تحديث البروفايل بنجاح!');
      this.profile = { ...this.formData };
    });
  }
  clearForm() {
    this.formData = {
      storeName: '',
      businessType: '',
      description: '',
      phoneNumber: '',
      address: '',
      websiteUrl: '',
      storeLogoUrl: ''
    };
  }
}
