import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterConfirmation } from './register-confirmation';

describe('RegisterConfirmation', () => {
  let component: RegisterConfirmation;
  let fixture: ComponentFixture<RegisterConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterConfirmation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterConfirmation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
