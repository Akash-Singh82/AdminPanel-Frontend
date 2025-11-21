import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailConfirmed } from './email-confirmed';

describe('EmailConfirmed', () => {
  let component: EmailConfirmed;
  let fixture: ComponentFixture<EmailConfirmed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailConfirmed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailConfirmed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
