import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTemplateEdit } from './email-template-edit';

describe('EmailTemplateEdit', () => {
  let component: EmailTemplateEdit;
  let fixture: ComponentFixture<EmailTemplateEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailTemplateEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmailTemplateEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
