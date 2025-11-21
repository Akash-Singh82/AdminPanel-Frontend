import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmsEdit } from './cms-edit';

describe('CmsEdit', () => {
  let component: CmsEdit;
  let fixture: ComponentFixture<CmsEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CmsEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
