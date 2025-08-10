import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalrChat } from './signalr-chat';

describe('SignalrChat', () => {
  let component: SignalrChat;
  let fixture: ComponentFixture<SignalrChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalrChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignalrChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
