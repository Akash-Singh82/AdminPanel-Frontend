import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResendSuccess } from './resend-success';

describe('ResendSuccess', () => {
  let component: ResendSuccess;
  let fixture: ComponentFixture<ResendSuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResendSuccess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResendSuccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
