import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import {
  Chart,
  BarController,
  BarElement,
  PieController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  PieController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

@Component({
  selector: 'app-chart',
  imports: [],
  templateUrl: './chart.html',
  styleUrl: './chart.css'
})
export class ChartComponent implements AfterViewInit, OnChanges {

  @ViewChild('chartCanvas')
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input()
  labels: string[] = [];

  @Input()
  values: number[] = [];

  @Input()
  type: 'bar' | 'pie' = 'bar';

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.chartCanvas &&
      (changes['labels'] || changes['values'])
    ) {
      this.createChart();
    }
  }

  private createChart(): void {
    if (!this.chartCanvas || !this.labels.length) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: this.type,

      data: {
        labels: this.labels,

        datasets: [
          {
            label: 'Count',
            data: this.values
          }
        ]
      },

      options: {
        responsive: true,

        plugins: {
          legend: {
            display: true
          }
        },

        scales: this.type === 'bar'
          ? {
              y: {
                beginAtZero: true
              }
            }
          : {}
      }
    });
  }
}