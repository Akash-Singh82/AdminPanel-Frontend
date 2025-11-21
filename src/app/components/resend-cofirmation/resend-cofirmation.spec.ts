import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResendCofirmation } from './resend-cofirmation';

describe('ResendCofirmation', () => {
  let component: ResendCofirmation;
  let fixture: ComponentFixture<ResendCofirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResendCofirmation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResendCofirmation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
