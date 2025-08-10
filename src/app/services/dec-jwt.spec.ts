import { TestBed } from '@angular/core/testing';

import { DecJwt } from './dec-jwt';

describe('DecJwt', () => {
  let service: DecJwt;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DecJwt);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
