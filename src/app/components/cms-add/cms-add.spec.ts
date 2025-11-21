import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmsAdd } from './cms-add';

describe('CmsAdd', () => {
  let component: CmsAdd;
  let fixture: ComponentFixture<CmsAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CmsAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
