import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RxState } from '@rx-angular/state';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { Observable } from 'rxjs';
import { EditDialogComponent } from '../edit-dialog/edit-dialog.component';

interface PeriodicElement {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

interface ComponentState {
  elements: PeriodicElement[];
  filteredElements: PeriodicElement[];
}

const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];

@Component({
  selector: 'app-periodic-table',
  templateUrl: './periodic-table.component.html',
  styleUrls: ['./periodic-table.component.css'],
  providers: [RxState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
  ],
})
export class PeriodicTableComponent implements OnInit {
  readonly displayedColumns: string[] = [
    'position',
    'name',
    'weight',
    'symbol',
    'actions',
  ];
  readonly filterControl = new FormControl('');

  constructor(
    public readonly state: RxState<ComponentState>,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Simulate data loading
    this.state.set({ elements: ELEMENT_DATA, filteredElements: ELEMENT_DATA });

    // Setup filter
    this.state.connect(
      'filteredElements',
      this.filterControl.valueChanges.pipe(
        startWith(''),
        debounceTime(2000),
        distinctUntilChanged(),
        map((filterValue) => this.filterElements(filterValue || ''))
      )
    );
  }

  openEditDialog(element: PeriodicElement) {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '250px',
      data: { ...element },
    });

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((result: PeriodicElement | undefined): Observable<void> => {
          if (result) {
            return new Observable<void>((observer) => {
              this.updateElement(result);
              observer.next();
              observer.complete();
            });
          }
          return new Observable<void>((observer) => {
            observer.next();
            observer.complete();
          });
        })
      )
      .subscribe();
  }

  private updateElement(updatedElement: PeriodicElement) {
    this.state.set((state) => ({
      elements: state.elements.map((el) =>
        el.position === updatedElement.position ? updatedElement : el
      ),
      filteredElements: state.filteredElements.map((el) =>
        el.position === updatedElement.position ? updatedElement : el
      ),
    }));
  }

  private filterElements(filterValue: string): PeriodicElement[] {
    return this.state
      .get('elements')
      .filter((element) =>
        Object.values(element).some((value) =>
          value.toString().toLowerCase().includes(filterValue.toLowerCase())
        )
      );
  }
}
