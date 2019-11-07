import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentCancellationParcialComponent } from './document-cancellation-parcial/document-cancellation-parcial.component';
import { DocumentCancellationParcialService } from './document-cancellation-parcialService/document-cancellation-parcial.service';
import { MdDatepickerModule, MatIconModule } from '@angular/material';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@NgModule({
  imports: [
    CommonModule,
    MdDatepickerModule,
    MatIconModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  declarations: [
    DocumentCancellationParcialComponent
  ],
  providers: [
    DocumentCancellationParcialService
  ],
  exports: [
    DocumentCancellationParcialComponent
  ],
  entryComponents: [
    DocumentCancellationParcialComponent
  ]
})
export class CofoAnulacionParcialModule { }
