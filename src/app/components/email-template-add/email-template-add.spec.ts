import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTemplateAdd } from './email-template-add';

describe('EmailTemplateAdd', () => {
  let component: EmailTemplateAdd;
  let fixture: ComponentFixture<EmailTemplateAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailTemplateAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailTemplateAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
