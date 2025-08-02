import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterSelection } from './register-selection';

describe('RegisterSelection', () => {
  let component: RegisterSelection;
  let fixture: ComponentFixture<RegisterSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterSelection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterSelection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
