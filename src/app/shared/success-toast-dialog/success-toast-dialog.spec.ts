import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccessToastDialog } from './success-toast-dialog';

describe('SuccessToastDialog', () => {
  let component: SuccessToastDialog;
  let fixture: ComponentFixture<SuccessToastDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccessToastDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuccessToastDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
