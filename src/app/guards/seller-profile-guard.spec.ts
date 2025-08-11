import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { sellerProfileGuard } from './seller-profile-guard';

describe('sellerProfileGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => sellerProfileGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
