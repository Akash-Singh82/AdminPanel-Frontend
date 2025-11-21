import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoDismissDialog } from './auto-dismiss-dialog';

describe('AutoDismissDialog', () => {
  let component: AutoDismissDialog;
  let fixture: ComponentFixture<AutoDismissDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoDismissDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoDismissDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
