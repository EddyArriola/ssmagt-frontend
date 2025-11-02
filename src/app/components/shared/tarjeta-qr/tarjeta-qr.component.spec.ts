import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaQrComponent } from './tarjeta-qr.component';

describe('TarjetaQrComponent', () => {
  let component: TarjetaQrComponent;
  let fixture: ComponentFixture<TarjetaQrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaQrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarjetaQrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
