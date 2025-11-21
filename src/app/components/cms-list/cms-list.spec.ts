import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmsList } from './cms-list';

describe('CmsList', () => {
  let component: CmsList;
  let fixture: ComponentFixture<CmsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CmsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
