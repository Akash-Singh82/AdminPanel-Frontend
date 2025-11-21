import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesAdd } from './roles-add';

describe('RolesAdd', () => {
  let component: RolesAdd;
  let fixture: ComponentFixture<RolesAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesAdd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
